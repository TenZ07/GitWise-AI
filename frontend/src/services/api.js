import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🔗 Connecting to API at:', API_URL); // Debug log

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to analyze a repo
export const analyzeRepo = async (repoUrl, force = false) => {
  try {
    const url = force ? '/api/repo/analyze?force=true' : '/api/repo/analyze';
    const response = await api.post(url, { repoUrl });
    return response.data;
  } catch (error) {
    // Preserve the original axios error so callers can check error.code (e.g. ERR_NETWORK)
    // but attach the backend message if available
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.data?.error) {
      error.message = error.response.data.error;
    }
    throw error;
  }
};
export default api;
