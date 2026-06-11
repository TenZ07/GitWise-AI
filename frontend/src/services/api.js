import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

console.log('🔗 [API] Connecting to backend at:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minute timeout for analysis requests
});

// Request interceptor — log every API call
api.interceptors.request.use((config) => {
  console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  config.metadata = { startTime: Date.now() };
  return config;
});

// Response interceptor — log response status and timing
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
    console.log(`📥 [API] ${response.status} ${response.config.url} (${duration}ms)`);
    
    // Log key fields for debugging
    const data = response.data;
    if (data?.savedRepo || data?.existingRepo) {
      const repo = data.savedRepo || data.existingRepo;
      console.log(`📋 [API] Response fields:`, {
        cached: !!data.cached,
        functionalSummary: repo.functionalSummary?.length || 0,
        targetAudienceAndUse: repo.targetAudienceAndUse?.length || 0,
        improvements: repo.improvements?.length || 0,
        codeHealthScore: repo.codeHealthScore,
      });
    }
    return response;
  },
  (error) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
    console.error(`❌ [API] Error ${error.response?.status || 'NETWORK'} ${error.config?.url} (${duration}ms)`);
    console.error(`   Message: ${error.response?.data?.message || error.message}`);
    throw error;
  }
);

// Helper function to analyze a repo
export const analyzeRepo = async (repoUrl, force = false) => {
  try {
    const url = force ? '/api/repo/analyze?force=true' : '/api/repo/analyze';
    console.log(`🔬 [API] Analyzing repo: ${repoUrl} (force: ${force})`);
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
