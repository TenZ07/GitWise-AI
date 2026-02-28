import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, Star, GitFork, Users, FileCode, AlertTriangle, CheckCircle, Terminal, RefreshCw, Loader2, MessageSquare, BarChart3 } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { analyzeRepo } from '../services/api';
import ChatBox from '../components/ChatBox'; // Import Chat Component

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const initialData = location.state?.repoData;
  const initialUrl = location.state?.repoData?.repoUrl;

  const [displayData, setDisplayData] = useState(initialData);
  const [repoUrl, setRepoUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  
  // ✅ Mobile Tab State: 'analysis' | 'chat'
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    if (!displayData && repoUrl) {
      fetchFromDatabase(repoUrl);
    } else if (!displayData && !repoUrl) {
      setIsLoading(false); 
    }
  }, []);

  const fetchFromDatabase = async (url) => {
    setIsLoading(true);
    try {
      const result = await analyzeRepo(url, false);
      if (result && result.data) {
        setDisplayData(result.data);
        setRepoUrl(result.data.repoUrl);
      } else {
        throw new Error("No data returned");
      }
    } catch (error) {
      toast.error("Failed to load data.");
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-semibold">Loading Repository Data...</h2>
      </div>
    );
  }

  if (!displayData) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center">
        <Toaster position="top-center" />
        <h2 className="text-2xl text-danger mb-4">No Repository Data Found</h2>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary rounded-lg hover:bg-primaryHover transition">
          Go Back Home
        </button>
      </div>
    );
  }

  // Helper Functions (Same as before)
  const getFunctionalSummary = () => {
    const aiSummary = displayData.functionalSummary || displayData.summary || displayData.aiSummary;
    if (aiSummary && aiSummary.trim().length > 0) return aiSummary;
    const desc = displayData.description || "this software project";
    const stack = displayData.techStack?.join(", ") || "modern web technologies";
    return `This repository hosts ${desc}. Built with ${stack}, it follows standard architectural patterns.`;
  };

  const getUseCase = () => {
    const aiUseCase = displayData.targetAudienceAndUse || displayData.useCaseSummary;
    if (aiUseCase && aiUseCase.trim().length > 0) return aiUseCase;
    return `Used by developers working with ${displayData.techStack?.slice(0,2).join(", ") || 'web tech'} to build applications.`;
  };

  const { 
    techStack, codeHealthScore, improvements, stars, forks, 
    contributors, recentCommits, owner, repoName, description, repoUrl: dataRepoUrl 
  } = displayData;

  useEffect(() => {
    if (dataRepoUrl && !repoUrl) setRepoUrl(dataRepoUrl);
  }, [dataRepoUrl, repoUrl]);

  const handleReanalyze = async () => {
    const urlToUse = repoUrl || dataRepoUrl;
    if (!urlToUse) return toast.error("URL not found");
    setIsReanalyzing(true);
    const loadingToast = toast.loading('Re-analyzing...');
    try {
      const result = await analyzeRepo(urlToUse.trim(), true);
      if (result && result.data) {
        setDisplayData(result.data);
        setRepoUrl(result.data.repoUrl);
        toast.success('Updated!', { id: loadingToast });
      }
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const getScoreColor = (score) => score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const scoreColor = getScoreColor(codeHealthScore);

  return (
    <div className="min-h-screen bg-bg text-textMain pb-20">
      <Toaster position="top-center" />
      
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
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
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                isReanalyzing ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />
              {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-warning fill-warning" /><span>{stars}</span></div>
            <div className="flex items-center gap-2"><GitFork className="w-4 h-4 text-accent" /><span>{forks}</span></div>
          </div>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex border-b border-white/10 bg-surface/30">
        <button 
          onClick={() => setActiveTab('analysis')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'analysis' ? 'text-primary border-b-2 border-primary' : 'text-textMuted'}`}
        >
          <BarChart3 size={16} /> Analysis
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-textMuted'}`}
        >
          <MessageSquare size={16} /> AI Chat
        </button>
      </div>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Analysis (Visible on Desktop OR if Mobile Tab is 'analysis') */}
          <div className={`lg:col-span-2 space-y-8 ${activeTab === 'chat' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Summary Card */}
            <div className="glass rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="p-2 bg-primary/20 rounded-lg"><FileCode className="w-6 h-6 text-primary" /></div>
                <h2 className="text-xl font-bold">AI Analysis</h2>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">What This Repo Does</h3>
                <p className="text-textMain leading-relaxed bg-surface/30 p-4 rounded-xl border-l-4 border-primary">{getFunctionalSummary()}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-success uppercase tracking-wider mb-2">What It Is Used For</h3>
                <p className="text-textMain leading-relaxed bg-surface/30 p-4 rounded-xl border-l-4 border-success">{getUseCase()}</p>
              </div>
              <div>
                <span className="text-xs text-textMuted mr-2">Tech Stack:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {techStack?.map((tech, i) => (
                    <span key={i} className="px-3 py-1 bg-surface border border-primary/30 rounded-full text-xs text-primary">{tech}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Health Score & Improvements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold mb-4">Code Health Score</h3>
                <div className="w-32 h-32">
                  <CircularProgressbar value={codeHealthScore} text={`${codeHealthScore}`} styles={buildStyles({ pathColor: scoreColor, textColor: '#fff', trailColor: '#2d2d44' })} />
                </div>
                <p className="mt-2 text-sm text-textMuted">{codeHealthScore >= 80 ? "Excellent" : codeHealthScore >= 50 ? "Good" : "Needs Work"}</p>
              </div>
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning"/> Key Improvements</h3>
                <ul className="space-y-2">
                  {improvements?.slice(0, 3).map((imp, i) => (
                    <li key={i} className="text-sm text-textMuted flex gap-2"><CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5"/> {imp}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Commits */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Terminal className="w-5 h-5 text-accent"/> Recent Activity</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {recentCommits?.slice(0, 5).map(c => (
                  <div key={c.sha} className="flex items-center gap-3 text-sm">
                    <img src={c.avatar} className="w-6 h-6 rounded-full" alt="" />
                    <span className="text-white truncate flex-1">{c.message}</span>
                    <span className="text-xs text-textMuted font-mono">{c.sha.substring(0,6)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Chat (Visible on Desktop OR if Mobile Tab is 'chat') */}
          <div className={`lg:col-span-1 ${activeTab === 'analysis' ? 'hidden lg:block' : 'block'}`}>
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <ChatBox repoUrl={repoUrl || dataRepoUrl} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;