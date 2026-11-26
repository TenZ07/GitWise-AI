// Regression tests for the Groq TPM-budget fix. Run with `npm test` in backend/.
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'test-key-only';
process.env.GROQ_MAX_RETRIES = '2';

const assert = require('node:assert/strict');
const axios = require('axios');
const { identifyCriticalFiles, analyzeCodeWithGroq } = require('../services/groqService');

const ok = (content) => ({
  data: { choices: [{ message: { content }, finish_reason: 'stop' }], usage: {} }
});

let post;
axios.post = (...args) => post(...args);

async function testCriticalFilesRepairAndValidation() {
  const paths = Array.from({ length: 200 }, (_, i) => `src/module${i}.js`);
  const truncated = '["src/module0.js","src/module1.js","src/module2.js';
  post = async () => ok(truncated);

  const result = await identifyCriticalFiles(
    paths.map(path => ({ type: 'file', path })),
    { owner: 'o', repoName: 'r', description: 'd', languages: {} }
  );

  assert.deepEqual(result, paths.slice(0, 3));
  console.log('✓ critical-files truncated JSON is repaired and validated');
}

async function testRetryOn429() {
  let attempts = 0;
  post = async () => {
    attempts += 1;
    if (attempts === 1) {
      const error = new Error('Request failed with status code 429');
      error.name = 'AxiosError';
      error.response = {
        status: 429,
        headers: {},
        data: { error: { message: 'Rate limit reached. Please try again in 0.1s.' } }
      };
      throw error;
    }
    return ok('["package.json"]');
  };

  const result = await identifyCriticalFiles(
    [{ type: 'file', path: 'package.json' }],
    { owner: 'o', repoName: 'r' }
  );

  assert.equal(attempts, 2);
  assert.deepEqual(result, ['package.json']);
  console.log('✓ 429 responses are retried');
}

async function testAnalysisStaysWithinTokenBudget() {
  let payload;
  post = async (_url, body) => {
    payload = body;
    return ok(JSON.stringify({
      functionalSummary: 'A specific summary.',
      targetAudienceAndUse: 'A specific audience.',
      codeQualityInsights: { strengths: ['s'], weaknesses: ['w'], codeSmells: [] },
      securityConcerns: [], architecturePatterns: { detected: [], recommendations: [] },
      performanceIssues: [], bestPractices: { followed: [], missing: [] },
      technicalDebt: [], improvements: ['Fix a thing (File: src/a.js)']
    }));
  };

  const files = Array.from({ length: 15 }, (_, i) => ({ path: `src/f${i}.js`, content: 'x'.repeat(3000) }));
  const result = await analyzeCodeWithGroq(
    files,
    { owner: 'o', repoName: 'r', description: 'd', languages: { JS: 1 } },
    'r'.repeat(5000)
  );

  const prompt = payload.messages[1].content;
  assert.ok(prompt.length < 14000, `prompt too large: ${prompt.length} chars`);
  assert.ok(payload.max_tokens <= 2600);
  assert.ok(!prompt.includes('r'.repeat(2000)), 'README excerpt must be capped');
  assert.equal(result.improvements.length, 1);
  console.log(`✓ analysis prompt capped at ${prompt.length} chars with max_tokens=${payload.max_tokens}`);
}

(async () => {
  await testCriticalFilesRepairAndValidation();
  await testRetryOn429();
  await testAnalysisStaysWithinTokenBudget();
  console.log('All Groq service tests passed.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
