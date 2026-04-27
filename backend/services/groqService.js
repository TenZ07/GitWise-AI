const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

TASK: Identify the 10-15 MOST CRITICAL files that should be analyzed to understand this codebase. Focus on:
1. Main entry points (index.js, main.py, app.js, server.js, etc.)
2. Core business logic files
3. Configuration files (package.json, requirements.txt, etc.)
4. Database models/schemas
5. API routes/controllers
6. Key utility/helper files
7. Important components (for frontend projects)

RULES:
- Prioritize files that reveal architecture and core functionality
- Avoid test files, build outputs, and documentation
- Limit to 15 files maximum
- Return ONLY a JSON array of file paths, nothing else

RESPONSE FORMAT (STRICT JSON):
["path/to/file1.js", "path/to/file2.py", "path/to/file3.jsx"]`;

    console.log('🤖 Calling Groq API to identify critical files...');

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a code analysis expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    let content = response.data.choices[0].message.content.trim();
    
    console.log('📥 Groq response received:', content.substring(0, 100) + '...');
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const criticalFiles = JSON.parse(content);
    
    if (!Array.isArray(criticalFiles)) {
      throw new Error('AI did not return an array of file paths');
    }

    console.log(`✅ Groq identified ${criticalFiles.length} critical files`);
    return criticalFiles.slice(0, 15);

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

    // Prepare code context
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
        
        return `
=== FILE: ${file.path} ===
${content.substring(0, 3000)} ${content.length > 3000 ? '... [truncated]' : ''}
`;
      })
      .join('\n\n');

    // ✅ UPDATED PROMPT - Includes README and prioritizes it for summaries
    const prompt = `You are a senior software architect performing a deep code review.

REPOSITORY: ${repoInfo.owner}/${repoInfo.repoName}
SHORT DESCRIPTION: ${repoInfo.description || 'No short description provided'}

README CONTENT:
${readmeContent ? readmeContent.substring(0, 4000) : 'No README file found'}

ANALYZED FILES:
${fileContents.map(f => f.path).join('\n')}

CODE CONTENT:
${codeContext}

⚠️ CRITICAL INSTRUCTIONS FOR SUMMARIES:
1. **PRIMARY SOURCE**: Use the **README CONTENT** to write "functionalSummary" and "targetAudienceAndUse".
2. **SECONDARY SOURCE**: If README is missing/short, use the **SHORT DESCRIPTION**.
3. **TERTIARY SOURCE**: If both are missing, infer from **CODE CONTENT** (package.json, main files, imports).
4. **NEVER USE GENERIC FALLBACKS**: Do not write "Used by developers working with...". Be specific based on the actual project.
5. **NO IMPROVEMENTS IN SUMMARY**: Do not include "should", "could", "refactor", "improve" in summaries.

Return a JSON object with this EXACT structure:

{
  "functionalSummary": "2-4 sentences describing WHAT this repository does based on README or Code. Be specific about features, technologies, and purpose.",
  
  "targetAudienceAndUse": "2-4 sentences describing WHO uses this software and WHY based on README or Code features. Focus on end-user goals.",
  
  "codeQualityInsights": {
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
    "codeSmells": ["Code smell 1", "Code smell 2"]
  },
  
  "securityConcerns": [
    {
      "issue": "Security issue description",
      "severity": "HIGH|MEDIUM|LOW",
      "file": "path/to/file.js",
      "recommendation": "How to fix it"
    }
  ],
  
  "architecturePatterns": {
    "detected": ["Pattern 1", "Pattern 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  
  "performanceIssues": [
    {
      "issue": "Performance concern",
      "file": "path/to/file.js",
      "impact": "HIGH|MEDIUM|LOW",
      "solution": "How to optimize"
    }
  ],
  
  "bestPractices": {
    "followed": ["Practice 1", "Practice 2"],
    "missing": ["Missing practice 1", "Missing practice 2"]
  },
  
  "technicalDebt": [
    "Technical debt item 1",
    "Technical debt item 2"
  ],
  
  "improvements": [
    "Actionable improvement suggestion 1 with specific file reference",
    "Actionable improvement suggestion 2 with specific file reference",
    "Actionable improvement suggestion 3 with specific file reference",
    "Actionable improvement suggestion 4 with specific file reference",
    "Actionable improvement suggestion 5 with specific file reference"
  ]
}

EXAMPLE OF GOOD functionalSummary (README-based):
"This repository contains a full-stack application for managing a snack box business. The frontend is built with React and utilizes various contexts for cart, customer, and menu management. The backend uses Express.js to handle API requests, including authentication, user management, and WhatsApp messaging."

EXAMPLE OF BAD functionalSummary (generic fallback - DO NOT USE):
"Used by developers working with JavaScript, CSS."

EXAMPLE OF GOOD targetAudienceAndUse (README-based):
"This software is designed for snack box business owners and customers. The application provides a user-friendly interface for customers to manage their carts, login, and receive updates via WhatsApp. Business owners can use the application to manage their menu, track sales, and send promotional messages."

EXAMPLE OF BAD targetAudienceAndUse (generic fallback - DO NOT USE):
"Used by developers working with web technologies."

EXAMPLE OF GOOD improvements (actionable, not duplicated from weaknesses):
[
  "Add rate limiting to backend API endpoints to prevent DoS attacks (File: server/src/index.js)",
  "Implement input validation for user data to prevent SQL injection (File: backend/routes/users.js)",
  "Use bcrypt for secure password hashing instead of plain text (File: backend/routes/auth.js)",
  "Add automated testing with Jest for critical endpoints (File: tests/)",
  "Implement caching for database queries to improve performance (File: backend/routes/users.js)"
]

EXAMPLE OF BAD improvements (duplicated from weaknesses):
[
  "Limited error handling",
  "Some functions have multiple responsibilities",
  "No clear separation of concerns"
]

⚠️ REMEMBER:
- Read the README first for summaries - it has the best project description
- If README says "AI Chatbot", write about AI Chatbot features, NOT generic web app text
- Weaknesses = CURRENT problems (for Deep Analysis section)
- Improvements = ACTIONABLE solutions with file references (for Key Improvements section)
- DO NOT copy weaknesses into improvements array
- Return ONLY valid JSON, no markdown or extra text`;

    console.log('🤖 Calling Groq API for code analysis...');

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a code analysis expert. Return ONLY valid JSON. Use README for summaries, not generic fallbacks.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    console.log('📥 Groq code analysis response received');

    let content = response.data.choices[0].message.content.trim();
    
    console.log('📝 Response preview:', content.substring(0, 150) + '...');
    
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }
    
    const analysis = JSON.parse(content);
    
    console.log('✅ Groq code analysis completed');
    return analysis;

  } catch (error) {
    console.error('❌ Groq Code Analysis Error:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from Groq API');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    
    console.error('Stack trace:', error.stack);
    
    // Minimal fallback only for error handling - throw error instead of fake data
    throw error;
  }
};

module.exports = {
  identifyCriticalFiles,
  analyzeCodeWithGroq
};