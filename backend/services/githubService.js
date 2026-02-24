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
    const [repoRes, commitsRes, contributorsRes, languagesRes, contentsRes] = await Promise.all([
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}`, { headers }),
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}/commits?per_page=10`, { headers }),
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}/contributors?per_page=10`, { headers }),
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}/languages`, { headers }),
      // Fetch root directory to get file tree structure (limited to first 100 items)
      axios.get(`${BASE_URL}/repos/${owner}/${repoName}/contents?per_page=100`, { headers })
    ]);

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

    // Process File Tree (simplified for now: just names and types)
    const fileTree = contentsRes.data
      .filter(item => item.type === 'file' || item.type === 'dir')
      .map(item => ({ name: item.name, type: item.type, path: item.path }));

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

module.exports = { fetchRepoData, parseRepoUrl };