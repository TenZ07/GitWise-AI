const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Free-tier Groq models share an 8000 TPM budget across calls in the same minute.
// Keep both the request context and the response cap small enough to stay under it.
const GROQ_MAX_RETRIES = Math.max(1, Number(process.env.GROQ_MAX_RETRIES || 4));
const GROQ_CODE_CHARS = Math.max(2000, Number(process.env.GROQ_CODE_CHARS || 9000));
const GROQ_README_CHARS = Math.max(200, Number(process.env.GROQ_README_CHARS || 1200));
const GROQ_CODE_MAX_TOKENS = Math.max(1024, Number(process.env.GROQ_CODE_MAX_TOKENS || 2600));
const MAX_RETRY_WAIT_MS = 30000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Best-effort repair for JSON that was cut off by a max_tokens limit.
 * Tracks strings so brackets inside file paths never corrupt the structure.
 */
const repairTruncatedJson = (text) => {
  let result = '';
  let inString = false;
  let escaped = false;
  const stack = [];

  for (const ch of text) {
    if (inString) {
      result += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
      continue;
    }
    if (ch === '{' || ch === '[') {
      stack.push(ch);
      result += ch;
      continue;
    }
    if (ch === '}' || ch === ']') {
      stack.pop();
      result += ch;
      continue;
    }
    result += ch;
  }

  if (inString) result += escaped ? '\\"' : '"';
  result = result.replace(/[\s,]+$/, '');

  while (stack.length) {
    const open = stack.pop();
    result += open === '{' ? '}' : ']';
  }
  return result;
};

const stripFences = (content) => String(content || '')
  .replace(/```json\n?/gi, '')
  .replace(/```\n?/g, '')
  .trim();

const parseArrayResponse = (content) => {
  const cleaned = stripFences(content);
  const first = cleaned.indexOf('[');
  const last = cleaned.lastIndexOf(']');
  let source = first === -1 ? cleaned : cleaned.slice(first);
  if (last > first) source = cleaned.slice(first, last + 1);

  try {
    const parsed = JSON.parse(source);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {
    // Fall through to the repair pass below.
  }

  const repaired = repairTruncatedJson(source);
  const parsed = JSON.parse(repaired);
  if (!Array.isArray(parsed)) throw new Error('AI did not return an array of file paths');
  return parsed;
};

const parseObjectResponse = (content) => {
  const cleaned = stripFences(content);
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  let source = first === -1 ? cleaned : cleaned.slice(first);
  if (last > first) source = cleaned.slice(first, last + 1);

  try {
    return JSON.parse(source);
  } catch (parseError) {
    console.error('❌ JSON parse failed. Raw content length:', source.length);
    console.error('❌ Last 100 chars:', source.substring(source.length - 100));
    console.log('🔧 Attempting to repair truncated JSON...');
    try {
      const repaired = repairTruncatedJson(source);
      const analysis = JSON.parse(repaired);
      console.log('✅ JSON repair successful');
      return analysis;
    } catch {
      console.error('❌ JSON repair also failed, throwing original error');
      throw parseError;
    }
  }
};

const isRetryableGroqError = (error) => {
  const status = error.response?.status;
  if (status === 429 || (status >= 500 && status < 600)) return true;
  if (!status && ['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN'].includes(error.code)) return true;
  return false;
};

const parseRetryDelayMs = (error, attempt) => {
  const header = error.response?.headers?.['retry-after'];
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) {
      return Math.max(1000, Math.min(MAX_RETRY_WAIT_MS, seconds * 1000 + 500));
    }
    const retryAt = Date.parse(header);
    if (!Number.isNaN(retryAt)) {
      return Math.max(1000, Math.min(MAX_RETRY_WAIT_MS, retryAt - Date.now() + 500));
    }
  }

  const message = error.response?.data?.error?.message || error.message || '';
  const match = message.match(/try again in\s+([\d.]+)\s*s/i);
  if (match) {
    return Math.max(1000, Math.min(MAX_RETRY_WAIT_MS, Number(match[1]) * 1000 + 500));
  }
  return Math.min(MAX_RETRY_WAIT_MS, 2000 * (2 ** (attempt - 1)));
};

/**
 * POST to Groq with bounded retries for TPM 429s, 5xx and transient network errors.
 */
const callGroq = async (payload, timeout = 45000) => {
  let lastError;

  for (let attempt = 1; attempt <= GROQ_MAX_RETRIES; attempt++) {
    try {
      return await axios.post(GROQ_API_URL, payload, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout
      });
    } catch (error) {
      lastError = error;
      if (!isRetryableGroqError(error) || attempt === GROQ_MAX_RETRIES) throw error;

      const waitMs = parseRetryDelayMs(error, attempt);
      console.warn(
        `⏳ Groq request throttled/failed (${error.response?.status || error.code || 'network'}) ` +
        `— retry ${attempt}/${GROQ_MAX_RETRIES - 1} in ${(waitMs / 1000).toFixed(1)}s`
      );
      await sleep(waitMs);
    }
  }

  throw lastError;
};

/**
 * Identifies critical files from directory structure using Groq AI
 */
const identifyCriticalFiles = async (fileTree, repoInfo) => {
  try {
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is missing in environment variables');
      throw new Error('GROQ_API_KEY is missing in environment variables');
    }

    const filePaths = fileTree
      .filter(item => item.type === 'file')
      .map(item => item.path)
      .slice(0, 200);

    if (filePaths.length === 0) {
      console.log('⚠️ No files found in repository');
      return [];
    }

    console.log(`📁 Found ${filePaths.length} files in repository`);

    const prompt = `You are a senior software architect analyzing a GitHub repository.

REPOSITORY: ${repoInfo.owner}/${repoInfo.repoName}
DESCRIPTION: ${repoInfo.description || 'No description'}
LANGUAGES: ${Object.keys(repoInfo.languages || {}).join(', ')}

FILE STRUCTURE:
${filePaths.join('\n')}

TASK: Identify the 10-15 MOST CRITICAL files that reveal architecture and core functionality.
Prioritize entry points, core logic, config files, models, routes/controllers and key utilities.
Avoid tests, build output and documentation.

Return ONLY a strict JSON array of exact paths from the FILE STRUCTURE above, maximum 15 items.
Example: ["package.json", "src/index.js", "src/routes/api.js"]`;

    console.log('🤖 Calling Groq API to identify critical files...');

    const response = await callGroq({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are a code analysis expert. Reply with valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 800
    });

    const content = response.data.choices[0]?.message?.content || '';
    console.log('📥 Groq response received:', content.substring(0, 100) + '...');

    const parsed = parseArrayResponse(content);
    const validPaths = new Set(filePaths);
    const criticalFiles = [...new Set(parsed.filter(path =>
      typeof path === 'string' && validPaths.has(path)
    ))].slice(0, 15);

    if (criticalFiles.length === 0) {
      throw new Error('AI returned no valid file paths from the repository');
    }

    console.log(`✅ Groq identified ${criticalFiles.length} critical files`);
    return criticalFiles;

  } catch (error) {
    console.error('❌ Groq Critical Files Error:', error.response?.data || error.message);

    const fallbackFiles = fileTree
      .filter(item => item.type === 'file')
      .filter(item => {
        const path = item.path.toLowerCase();
        return (
          path.includes('package.json') ||
          path.includes('index.') ||
          path.includes('main.') ||
          path.includes('app.') ||
          path.includes('server.') ||
          path.includes('config') ||
          path.match(/\.(js|py|java|go|rs|ts)$/)
        );
      })
      .slice(0, 10)
      .map(item => item.path);

    console.log('⚠️ Using fallback file selection');
    return fallbackFiles;
  }
};

/**
 * Analyzes code content using Groq AI - with README support for better summaries
 * @param {Array} fileContents - Array of file objects { path, content }
 * @param {Object} repoInfo - Repo metadata (owner, name, description, etc.)
 * @param {String} readmeContent - Content of README.md file (optional)
 */
const analyzeCodeWithGroq = async (fileContents, repoInfo, readmeContent = '') => {
  try {
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is missing in environment variables');
      throw new Error('GROQ_API_KEY is missing in environment variables');
    }

    if (!fileContents || fileContents.length === 0) {
      console.log('⚠️ No file contents to analyze');
      throw new Error('No file contents provided');
    }

    console.log(`🔍 Analyzing ${fileContents.length} files with Groq AI...`);

    // Keep the combined prompt under the free-tier TPM budget (8000 tokens/minute).
    const maxCharsPerFile = Math.max(400, Math.floor(GROQ_CODE_CHARS / fileContents.length));
    console.log(`[GROQ SERVICE] Dynamic content cap: max ${maxCharsPerFile} chars per file (total files: ${fileContents.length}).`);

    const codeContext = fileContents
      .map(file => {
        let content = file.content;
        if (typeof content !== 'string') {
          console.warn(`⚠️ File ${file.path} content is not a string, converting...`);
          if (Buffer.isBuffer(content)) {
            content = content.toString('utf-8');
          } else if (typeof content === 'object') {
            content = JSON.stringify(content);
          } else {
            content = String(content);
          }
        }

        const isTruncated = content.length > maxCharsPerFile;
        const slicedContent = content.substring(0, maxCharsPerFile);

        return `
=== FILE: ${file.path} ===
${slicedContent} ${isTruncated ? '\n... [truncated to save tokens]' : ''}
`;
      })
      .join('\n\n');

    const prompt = `You are a senior software architect performing a deep code review.

REPOSITORY: ${repoInfo.owner}/${repoInfo.repoName}
DESCRIPTION: ${repoInfo.description || 'No description provided'}

README EXCERPT:
${readmeContent ? readmeContent.substring(0, GROQ_README_CHARS) : 'No README file found'}

FILES ANALYZED:
${fileContents.map(f => f.path).join('\n')}

CODE CONTENT:
${codeContext}

Return a JSON object with EXACTLY these keys:
{
  "functionalSummary": "2-4 sentences on WHAT the repo does; use README first, then description, then code. Max 60 words.",
  "targetAudienceAndUse": "2-4 sentences on WHO uses it and WHY; same source priority. Max 60 words.",
  "codeQualityInsights": {
    "strengths": ["3 concrete strengths"],
    "weaknesses": ["3 current weaknesses"],
    "codeSmells": ["2 code smells"]
  },
  "securityConcerns": [
    { "issue": "description", "severity": "HIGH|MEDIUM|LOW", "file": "path", "recommendation": "fix" }
  ],
  "architecturePatterns": {
    "detected": ["patterns found"],
    "recommendations": ["architectural recommendations"]
  },
  "performanceIssues": [
    { "issue": "description", "file": "path", "impact": "HIGH|MEDIUM|LOW", "solution": "fix" }
  ],
  "bestPractices": { "followed": ["practices"], "missing": ["practices"] },
  "technicalDebt": ["items"],
  "improvements": ["5 actionable suggestions with specific file references"]
}

RULES:
- Base summaries on the README, not generic phrases like "used by developers".
- Arrays: at most 3 items except improvements (5) and codeSmells (2).
- securityConcerns and performanceIssues must use the exact key names shown.
- Improvements must be actionable solutions, not copies of weaknesses.
- Return ONLY valid JSON, no markdown.`;

    console.log('🤖 Calling Groq API for code analysis...');

    const response = await callGroq({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'You are a code analysis expert. Return ONLY valid JSON. Use the README for summaries.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: GROQ_CODE_MAX_TOKENS
    }, 60000);

    console.log('📥 Groq code analysis response received');
    console.log('📊 Groq usage:', JSON.stringify(response.data.usage || {}));

    const content = response.data.choices[0]?.message?.content || '';
    const finishReason = response.data.choices[0]?.finish_reason;
    console.log('📝 Response preview:', content.substring(0, 200) + '...');
    console.log('🏁 Finish reason:', finishReason);

    if (finishReason === 'length') {
      console.warn('⚠️ Groq response was TRUNCATED (hit max_tokens). Missing fields will be filled from repo metadata.');
    }

    const analysis = parseObjectResponse(content);

    // ✅ FIELD VALIDATION — Log what we got and fill missing fields
    const expectedFields = ['functionalSummary', 'targetAudienceAndUse', 'codeQualityInsights',
      'securityConcerns', 'architecturePatterns', 'performanceIssues', 'bestPractices',
      'technicalDebt', 'improvements'];

    const missingFields = expectedFields.filter(f => !analysis[f]);
    if (missingFields.length > 0) {
      console.warn('⚠️ Missing fields in Groq response:', missingFields.join(', '));
    }

    console.log('📋 Field validation:');
    console.log('   functionalSummary:', analysis.functionalSummary ? `✅ (${analysis.functionalSummary.length} chars)` : '❌ MISSING');
    console.log('   targetAudienceAndUse:', analysis.targetAudienceAndUse ? `✅ (${analysis.targetAudienceAndUse.length} chars)` : '❌ MISSING');
    console.log('   improvements:', Array.isArray(analysis.improvements) ? `✅ (${analysis.improvements.length} items)` : '❌ MISSING');
    console.log('   securityConcerns:', Array.isArray(analysis.securityConcerns) ? `✅ (${analysis.securityConcerns.length} items)` : '❌ MISSING');

    // Generate missing summary fields from available data
    if (!analysis.functionalSummary || analysis.functionalSummary.trim().length < 10) {
      console.warn('⚠️ Generating functionalSummary from repo info...');
      const desc = repoInfo.description || '';
      const langs = Object.keys(repoInfo.languages || {}).join(', ');
      analysis.functionalSummary = desc
        ? `${repoInfo.repoName} — ${desc}. Built with ${langs || 'various technologies'}.`
        : `${repoInfo.repoName} is a software project built with ${langs || 'various technologies'}. ${readmeContent ? 'See README for details.' : ''}`;
    }

    if (!analysis.targetAudienceAndUse || analysis.targetAudienceAndUse.trim().length < 10) {
      console.warn('⚠️ Generating targetAudienceAndUse from repo info and README...');
      if (readmeContent && readmeContent.length > 50) {
        const readmeLines = readmeContent.split('\n')
          .filter(l => l.trim().length > 20 && !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('|'))
          .slice(0, 3);
        analysis.targetAudienceAndUse = readmeLines.join(' ').substring(0, 500) ||
          `This project is intended for developers and users working with ${Object.keys(repoInfo.languages || {}).join(', ') || 'this technology stack'}.`;
      } else {
        const desc = repoInfo.description || repoInfo.repoName;
        analysis.targetAudienceAndUse = `This project is designed for developers and users who need ${desc}. It provides functionality built with ${Object.keys(repoInfo.languages || {}).join(', ') || 'modern technologies'}.`;
      }
    }

    // Ensure array fields exist
    if (!Array.isArray(analysis.improvements)) analysis.improvements = [];
    if (!Array.isArray(analysis.securityConcerns)) analysis.securityConcerns = [];
    if (!Array.isArray(analysis.performanceIssues)) analysis.performanceIssues = [];
    if (!Array.isArray(analysis.technicalDebt)) analysis.technicalDebt = [];
    if (!analysis.codeQualityInsights) analysis.codeQualityInsights = { strengths: [], weaknesses: [], codeSmells: [] };
    if (!analysis.architecturePatterns) analysis.architecturePatterns = { detected: [], recommendations: [] };
    if (!analysis.bestPractices) analysis.bestPractices = { followed: [], missing: [] };

    console.log('✅ Groq code analysis completed with all fields validated');
    return analysis;

  } catch (error) {
    console.error('❌ Groq Code Analysis Error:');
    console.error('   Error type:', error.name);
    console.error('   Error message:', error.message);

    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received from Groq API');
    } else if (error.code === 'ECONNABORTED') {
      console.error('   Request timeout');
    }

    // Minimal fallback only for error handling - throw error instead of fake data
    throw error;
  }
};

module.exports = {
  identifyCriticalFiles,
  analyzeCodeWithGroq
};
