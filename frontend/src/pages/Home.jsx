import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Search, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { analyzeRepo } from '../services/api';
import toast, { Toaster } from 'react-hot-toast';

const Home = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🏠 [Home] Submit triggered');
    console.log('📝 Input URL:', url);

    // 1. Validation
    if (!url || typeof url !== 'string') {
      toast.error('Please enter a repository URL');
      return;
    }

    const cleanUrl = url.trim();
    if (!cleanUrl.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL');
      return;
    }

    setLoading(true);
    try {
      console.log('📡 Sending request to analyze...', cleanUrl);
      
      // 2. API Call
      const result = await analyzeRepo(cleanUrl);
      
      console.log('✅ Full API Response:', result);

      // 3. ✅ FIX: Extract data correctly (handles both savedRepo and existingRepo)
      const repoData = result.savedRepo || result.existingRepo || result.data;

      if (!repoData) {
        console.error('❌ No valid data found in response:', result);
        throw new Error('No data returned from server');
      }

      // 4. Success Feedback
      toast.success(result.cached ? 'Loaded from cache! ⚡' : 'Analysis complete! 🎉');

      // 5. Navigate to Dashboard
      console.log('🚀 Navigating to dashboard...', repoData.owner, repoData.repoName);
      navigate('/dashboard', { state: { repoData } });

    } catch (error) {
      console.error('💥 Home Page Error:', error);
      
      let errorMsg = 'Failed to analyze repository';
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        errorMsg = 'Cannot connect to backend. Is the server running?';
      } else if (error.message) {
        errorMsg = error.message;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-textMain flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl z-10 space-y-8 text-center animate-fade-in">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-surface border border-white/10 rounded-2xl shadow-xl mb-4 relative group">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <Github className="w-12 h-12 text-primary relative z-10" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            GitWise <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">AI</span>
          </h1>
          <p className="text-lg text-textMuted max-w-lg mx-auto leading-relaxed">
            Get instant AI-powered insights, architecture analysis, and code health scores for any GitHub repository.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-accent rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
          
          <div className="relative flex items-center bg-surface border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="pl-4 text-textMuted">
              <Search className="w-5 h-5" />
            </div>
            
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full bg-transparent border-none outline-none text-white px-4 py-4 text-base placeholder:text-textMuted/50 focus:placeholder:text-textMuted/80 transition"
              disabled={loading}
            />
            
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className={`m-2 px-6 py-2.5 font-medium rounded-lg transition-all duration-300 flex items-center gap-2 relative overflow-hidden ${
                loading 
                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primaryHover text-white shadow-lg shadow-primary/25 hover:shadow-primary/40'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="relative z-10">Analyzing...</span>
                  {/* Pulsing effect behind spinner */}
                  <div className="absolute inset-0 bg-white/10 animate-pulse rounded-lg"></div>
                </>
              ) : (
                <>
                  <span className="relative z-10">Analyze</span>
                  <Sparkles className="w-4 h-4 relative z-10" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <FeatureCard 
            icon={<AlertCircle className="w-6 h-6 text-primary" />}
            title="Code Health Score"
            desc="Get an instant 0-100 score based on structure, maintainability, and best practices."
          />
          <FeatureCard 
            icon={<Github className="w-6 h-6 text-accent" />}
            title="Deep Architecture"
            desc="Understand the tech stack, file structure, and design patterns used in the project."
          />
          <FeatureCard 
            icon={<Search className="w-6 h-6 text-success" />}
            title="AI Improvements"
            desc="Receive 5 specific, actionable suggestions to refactor and improve your codebase."
          />
        </div>
      </div>
    </div>
  );
};

// Simple Feature Card Component
const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-6 bg-surface/30 border border-white/5 rounded-2xl backdrop-blur-sm hover:border-primary/30 hover:bg-surface/50 transition duration-300 group">
    <div className="mb-4 p-3 bg-surface rounded-lg inline-block group-hover:scale-110 transition duration-300">{icon}</div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-textMuted leading-relaxed">{desc}</p>
  </div>
);

export default Home;