import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to analyze a repo
export const analyzeRepo = async (repoUrl) => {
  try {
    const response = await api.post('/api/repo/analyze', { repoUrl });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error.response?.data || { message: 'Failed to analyze repository' };
  }
};

export default api;