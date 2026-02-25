import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Github, Sparkles, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { analyzeRepo } from '../services/api';

const Home = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.includes('github.com')) {
      toast.error('Please enter a valid GitHub URL (e.g., https://github.com/user/repo)');
      return;
    }

    setLoading(true);
    try {
      // Call Backend
      const result = await analyzeRepo(url);
      
      toast.success(result.cached ? 'Loaded from cache!' : 'Analysis complete!');
      
      // Navigate to Dashboard with the data
      // We pass the full data object via state to avoid refetching immediately
      navigate('/dashboard', { state: { repoData: result.data } });
      
    } catch (error) {
      toast.error(error.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-textMain relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />

      <div className="z-10 w-full max-w-3xl px-6 text-center animate-fade-in">
        {/* Logo / Title */}
        <div className="mb-8 inline-flex items-center justify-center gap-3">
          <div className="p-3 bg-surface border border-primary/30 rounded-xl shadow-lg shadow-primary/20">
            <Github className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            GitWise AI
          </h1>
        </div>

        <p className="text-textMuted text-lg mb-10 max-w-xl mx-auto">
          Paste any public GitHub repository URL to get an <span className="text-primary font-semibold">AI-powered architecture analysis</span>, health score, and actionable improvements.
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
          
          <div className="relative flex items-center bg-surface border border-white/10 rounded-xl p-2 shadow-2xl">
            <Search className="w-6 h-6 text-textMuted ml-4" />
            <input
              type="text"
              placeholder="https://github.com/username/repository"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder-textMuted/50 text-lg"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                loading 
                  ? 'bg-gray-700 cursor-not-allowed text-gray-400' 
                  : 'bg-primary hover:bg-primaryHover text-white shadow-lg shadow-primary/30 hover:shadow-primary/50'
              }`}
            >
              {loading ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Analyze
                  <Sparkles className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Features Hint */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-textMuted">
          <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-white/5">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <span>AI Summary & Stack</span>
          </div>
          <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-white/5">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <span>Health Score</span>
          </div>
          <div className="flex flex-col items-center gap-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-white/5">
              <Github className="w-5 h-5 text-success" />
            </div>
            <span>Commit Insights</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;