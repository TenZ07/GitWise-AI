import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, Star, GitFork, Users, FileCode, AlertTriangle, CheckCircle, Terminal, RefreshCw, Loader2 } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { analyzeRepo } from '../services/api';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 1. Get initial data and URL from navigation state
  const initialData = location.state?.repoData;
  const initialUrl = location.state?.repoData?.repoUrl;

  // 2. State Management
  const [displayData, setDisplayData] = useState(initialData);
  const [repoUrl, setRepoUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(!initialData); // Load if no data
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // 3. 🔄 EFFECT: If data is missing but we have the URL, fetch from DB
  useEffect(() => {
    if (!displayData && repoUrl) {
      fetchFromDatabase(repoUrl);
    } else if (!displayData && !repoUrl) {
      // No data AND no URL? Show error immediately.
      setIsLoading(false); 
    }
  }, []);

  const fetchFromDatabase = async (url) => {
    setIsLoading(true);
    try {
      // Call analyze WITHOUT force=true to just get cached data quickly
      const result = await analyzeRepo(url, false);
      
      if (result && result.data) {
        setDisplayData(result.data);
        setRepoUrl(result.data.repoUrl);
      } else {
        throw new Error("No data returned from server");
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      toast.error("Failed to load repository data. Please try again.");
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER LOADING STATE ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Loading Repository Data...</h2>
        <p className="text-textMuted mt-2">Fetching from database</p>
      </div>
    );
  }

  // --- RENDER ERROR STATE ---
  if (!displayData) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center">
        <Toaster position="top-center" />
        <h2 className="text-2xl text-danger mb-4">No Repository Data Found</h2>
        <p className="text-textMuted mb-6 text-center max-w-md">
          Could not load data for this repository.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary rounded-lg hover:bg-primaryHover transition font-semibold shadow-lg shadow-primary/20"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  // --- 🛡️ ULTRA-ROBUST HELPER FUNCTIONS ---
  
  const getFunctionalSummary = () => {
    // 1. Try all possible keys from AI response
    const aiSummary = displayData.functionalSummary || 
                      displayData.summary || 
                      (displayData.architectureAssessment ? 
                        `Architecture Pattern: ${displayData.architectureAssessment.pattern}. This system utilizes a ${displayData.architectureAssessment.pattern} structure.` : 
                        null) ||
                      displayData.aiSummary;

    // 2. If we have a valid string, return it
    if (aiSummary && typeof aiSummary === 'string' && aiSummary.trim().length > 0) {
      return aiSummary;
    }

    // 3. ULTIMATE FALLBACK: Generate a sentence from Repo Description & Tech Stack
    const desc = displayData.description || "this software project";
    const stack = displayData.techStack && displayData.techStack.length > 0 
                  ? displayData.techStack.join(", ") 
                  : "modern web technologies";
    
    return `This repository hosts ${desc}. It is technically implemented using ${stack}, following standard architectural patterns for this technology stack to deliver its intended functionality.`;
  };

  const getUseCase = () => {
    const aiUseCase = displayData.targetAudienceAndUse || 
                      displayData.useCaseSummary || 
                      displayData.useCase || 
                      displayData.purpose;

    if (aiUseCase && typeof aiUseCase === 'string' && aiUseCase.trim().length > 0) {
      return aiUseCase;
    }

    // Fallback for Use Case
    const stack = displayData.techStack && displayData.techStack.length > 0 
                  ? displayData.techStack.slice(0, 2).join(", ") 
                  : "Unknown";
    return `Based on the tech stack (${stack}), this project is likely used by developers to build modern web applications.`;
  };

  const { 
    techStack, codeHealthScore, improvements, stars, forks, 
    contributors, recentCommits, owner, repoName, description, repoUrl: dataRepoUrl 
  } = displayData;

  // Ensure repoUrl state is synced
  useEffect(() => {
    if (dataRepoUrl && !repoUrl) setRepoUrl(dataRepoUrl);
  }, [dataRepoUrl, repoUrl]);

  // --- RE-ANALYZE HANDLER ---
  const handleReanalyze = async () => {
    const urlToUse = repoUrl || dataRepoUrl;
    if (!urlToUse) {
      toast.error("Repository URL not found.");
      return;
    }

    setIsReanalyzing(true);
    const loadingToast = toast.loading('Clearing cache & fetching fresh data...');

    try {
      const result = await analyzeRepo(urlToUse.trim(), true);
      
      if (result && result.data) {
        setDisplayData(result.data);
        setRepoUrl(result.data.repoUrl);
        toast.success('Analysis updated successfully!', { id: loadingToast });
      } else {
        throw new Error("Invalid response");
      }
    } catch (error) {
      toast.error(error.message || 'Failed to re-analyze', { id: loadingToast });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const scoreColor = getScoreColor(codeHealthScore);

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-bg text-textMain pb-20">
      <Toaster position="top-center" />
      
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Github className="w-6 h-6 text-primary" />
                {owner} / {repoName}
              </h1>
              <p className="text-xs text-textMuted truncate max-w-md">{description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            {/* 🔄 RE-ANALYZE BUTTON */}
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isReanalyzing 
                  ? 'bg-gray-800 text-gray-400 border-gray-700 cursor-not-allowed' 
                  : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
              {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>

            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-warning fill-warning" />
              <span>{stars}</span>
            </div>
            <div className="flex items-center gap-2">
              <GitFork className="w-4 h-4 text-accent" />
              <span>{forks}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 animate-fade-in">
        
        {/* Top Grid: Summary & Health Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Summary Card */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileCode className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">AI Analysis</h2>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">What This Repo Does</h3>
              <p className="text-textMain leading-relaxed text-base bg-surface/30 p-4 rounded-xl border-l-4 border-primary">
                {getFunctionalSummary()}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-success uppercase tracking-wider mb-2">What It Is Used For</h3>
              <p className="text-textMain leading-relaxed text-base bg-surface/30 p-4 rounded-xl border-l-4 border-success">
                {getUseCase()}
              </p>
            </div>

            <div className="pt-2">
              <span className="text-xs text-textMuted mr-2">Tech Stack:</span>
              <div className="inline-flex flex-wrap gap-2">
                {techStack && techStack.length > 0 ? (
                  techStack.map((tech, idx) => (
                    <span key={idx} className="px-3 py-1 bg-surface border border-primary/30 rounded-full text-xs text-primary font-medium">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-textMuted">Not detected</span>
                )}
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h2 className="text-lg font-bold mb-4 z-10">Code Health Score</h2>
            <div className="w-40 h-40 z-10">
              <CircularProgressbar 
                value={codeHealthScore || 0} 
                text={`${codeHealthScore || 0}`}
                styles={buildStyles({
                  textSize: '24px',
                  pathColor: scoreColor,
                  textColor: '#fff',
                  trailColor: '#2d2d44',
                  backgroundColor: '#0a0a0f',
                })}
              />
            </div>
            <p className="mt-4 text-sm text-textMuted text-center z-10">
              {codeHealthScore >= 80 ? "Excellent!" : codeHealthScore >= 50 ? "Good, needs work." : "Needs refactoring."}
            </p>
          </div>
        </div>

        {/* Improvements */}
        <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-warning/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <h2 className="text-xl font-bold">AI Recommended Improvements</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {improvements && improvements.length > 0 ? (
              improvements.map((imp, idx) => (
                <div key={idx} className="flex gap-3 p-4 bg-surface/50 rounded-xl border border-white/5 hover:border-primary/30 transition duration-300">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-textMuted leading-relaxed">{imp}</p>
                </div>
              ))
            ) : (
              <p className="text-textMuted">No improvements generated.</p>
            )}
          </div>
        </div>

        {/* Commits & Contributors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold">Recent Activity</h2>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {recentCommits && recentCommits.length > 0 ? (
                recentCommits.map((commit) => (
                  <div key={commit.sha} className="flex items-start gap-3 pb-3 border-b border-white/5 last:border-0">
                    <img src={commit.avatar} alt={commit.author} className="w-8 h-8 rounded-full border border-white/10" />
                    <div>
                      <p className="text-sm font-medium text-white line-clamp-1">{commit.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-textMuted">{commit.author}</span>
                        <span className="text-xs text-primary font-mono">{commit.sha}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-textMuted">No commits found.</p>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-success" />
              <h2 className="text-xl font-bold">Top Contributors</h2>
            </div>
            <div className="space-y-4">
              {contributors && contributors.length > 0 ? (
                contributors.slice(0, 5).map((contributor, idx) => (
                  <div key={contributor.login} className="flex items-center justify-between p-3 bg-surface/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-textMuted w-6">#{idx + 1}</span>
                      <img src={contributor.avatar_url} alt={contributor.login} className="w-10 h-10 rounded-full border border-primary/30" />
                      <span className="font-medium">{contributor.login}</span>
                    </div>
                    <span className="text-sm text-primary font-mono bg-primary/10 px-3 py-1 rounded-full">
                      {contributor.contributions} commits
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-textMuted">No contributors found.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;