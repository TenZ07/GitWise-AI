const axios = require('axios');
const Repo = require('../models/Repo');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = 'https://api.github.com';

// Helper to parse GitHub URL (e.g., https://github.com/owner/repo)
const parseRepoUrl = (url) => {
  const regex = /github\.com\/([^/]+)\/([^/]+)/;
  const match = url.match(regex);
  if (!match) throw new Error('Invalid GitHub URL format. Use: https://github.com/owner/repo');
  return { owner: match[1], repoName: match[2] };
};

/**
 * Fetches file content from GitHub
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - File content and metadata
 */
const fetchFileContent = async (owner, repoName, filePath) => {
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3.raw' // Get raw content
  };

  try {
    const response = await axios.get(
      `${BASE_URL}/repos/${owner}/${repoName}/contents/${filePath}`,
      { headers, responseType: 'text' } // Ensure we get text
    );

    // Convert to string if it's not already
    let content = response.data;
    if (typeof content !== 'string') {
      if (Buffer.isBuffer(content)) {
        content = content.toString('utf-8');
      } else if (typeof content === 'object') {
        content = JSON.stringify(content);
      } else {
        content = String(content);
      }
    }

    return {
      path: filePath,
      content: content,
      size: content.length
    };
  } catch (error) {
    console.error(`❌ Failed to fetch ${filePath}:`, error.message);
    return {
      path: filePath,
      content: null,
      error: error.message
    };
  }
};

/**
 * Fetches multiple file contents in parallel
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {Array<string>} filePaths - Array of file paths
 * @returns {Promise<Array>} - Array of file contents
 */
const fetchMultipleFiles = async (owner, repoName, filePaths) => {
  console.log(`📥 Fetching ${filePaths.length} files from GitHub...`);
  
  const filePromises = filePaths.map(path => fetchFileContent(owner, repoName, path));
  const results = await Promise.all(filePromises);
  
  // Filter out failed fetches
  const successfulFetches = results.filter(file => file.content !== null);
  console.log(`✅ Successfully fetched ${successfulFetches.length}/${filePaths.length} files`);
  
  return successfulFetches;
};

/**
 * Recursively fetches file tree from GitHub
 * @param {string} owner - Repository owner
 * @param {string} repoName - Repository name
 * @param {string} path - Directory path (default: root)
 * @param {number} depth - Maximum recursion depth
 * @returns {Promise<Array>} - Array of file objects
 */
const fetchFileTreeRecursive = async (owner, repoName, path = '', depth = 2) => {
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  };

  try {
    const response = await axios.get(
      `${BASE_URL}/repos/${owner}/${repoName}/contents/${path}`,
      { headers }
    );

    let allFiles = [];

    for (const item of response.data) {
      if (item.type === 'file') {
        allFiles.push({ name: item.name, type: 'file', path: item.path });
      } else if (item.type === 'dir' && depth > 0) {
        // Skip common directories that don't contain source code
        const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out', 'public', 'assets'];
        if (!skipDirs.includes(item.name)) {
          const subFiles = await fetchFileTreeRecursive(owner, repoName, item.path, depth - 1);
          allFiles = allFiles.concat(subFiles);
        }
      }
    }

    return allFiles;
  } catch (error) {
    console.error(`Failed to fetch tree for ${path}:`, error.message);
    return [];
  }
};

/**
 * Fetches all repo data in parallel
 * @param {string} repoUrl - The full GitHub repository URL
 * @returns {Promise<Object>} - Combined repo data
 */
const fetchRepoData = async (repoUrl) => {
  const { owner, repoName } = parseRepoUrl(repoUrl);
  
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json'
  };

  try {
    // Execute all requests in parallel for speed
    const [repoRes, commitsRes, contributorsRes, languagesRes] = await Promise.all([
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}`, { headers }),
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}/commits?per_page=10`, { headers }),
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}/contributors?per_page=10`, { headers }),
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}/languages`, { headers })
    ]);

    // Fetch file tree recursively (up to 2 levels deep)
    console.log('📂 Fetching file tree recursively...');
    const fileTree = await fetchFileTreeRecursive(owner, repoName, '', 2);
    console.log(`✅ Found ${fileTree.length} files in repository`);

    // Process Commits
    const recentCommits = commitsRes.data.map(commit => ({
      sha: commit.sha.substring(0, 7),
      message: commit.commit.message.split('\n')[0], // First line only
      author: commit.commit.author?.name || 'Unknown',
      avatar: commit.author?.avatar_url || 'https://github.com/identicons/default.png',
      date: commit.commit.author?.date
    }));

    // Process Contributors
    const contributors = contributorsRes.data.map(contrib => ({
      login: contrib.login,
      avatar_url: contrib.avatar_url,
      contributions: contrib.contributions
    }));

    return {
      basicInfo: {
        owner,
        repoName,
        description: repoRes.data.description || 'No description provided.',
        stars: repoRes.data.stargazers_count,
        forks: repoRes.data.forks_count,
        languages: languagesRes.data
      },
      recentCommits,
      contributors,
      fileTree
    };

  } catch (error) {
    console.error('GitHub API Error:', error.response?.data || error.message);
    throw new Error(`Failed to fetch repo data: ${error.response?.data?.message || error.message}`);
  }
};

module.exports = { 
  fetchRepoData, 
  parseRepoUrl,
  fetchFileContent,
  fetchMultipleFiles,
  fetchFileTreeRecursive
};