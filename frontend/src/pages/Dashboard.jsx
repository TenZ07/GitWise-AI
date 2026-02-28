import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, Star, GitFork, Users, FileCode, AlertTriangle, CheckCircle, Terminal, RefreshCw, Loader2, MessageSquare, BarChart3, Trophy } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { analyzeRepo } from '../services/api';
import ChatBox from '../components/ChatBox';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const initialData = location.state?.repoData;
  const initialUrl = location.state?.repoData?.repoUrl;

  const [displayData, setDisplayData] = useState(initialData);
  const [repoUrl, setRepoUrl] = useState(initialUrl);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    if (!displayData && repoUrl) fetchFromDatabase(repoUrl);
    else if (!displayData && !repoUrl) setIsLoading(false);
  }, []);

  const fetchFromDatabase = async (url) => {
    setIsLoading(true);
    try {
      const result = await analyzeRepo(url, false);
      if (result && result.data) {
        setDisplayData(result.data);
        setRepoUrl(result.data.repoUrl);
      } else throw new Error("No data returned");
    } catch (error) {
      toast.error("Failed to load data.");
      navigate('/');
    } finally { setIsLoading(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-semibold">Loading Repository Data...</h2>
    </div>
  );

  if (!displayData) return (
    <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center">
      <Toaster position="top-center" />
      <h2 className="text-2xl text-danger mb-4">No Repository Data Found</h2>
      <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary rounded-lg hover:bg-primaryHover transition">Go Back Home</button>
    </div>
  );

  // Helpers
  const getFunctionalSummary = () => {
    const aiSummary = displayData.functionalSummary || displayData.summary || displayData.aiSummary;
    if (aiSummary && aiSummary.trim().length > 0) return aiSummary;
    return `This repository hosts ${displayData.description || 'a software project'}. Built with ${displayData.techStack?.join(", ") || 'web technologies'}.`;
  };

  const getUseCase = () => {
    const aiUseCase = displayData.targetAudienceAndUse || displayData.useCaseSummary;
    if (aiUseCase && aiUseCase.trim().length > 0) return aiUseCase;
    return `Used by developers working with ${displayData.techStack?.slice(0,2).join(", ") || 'web tech'}.`;
  };

  const { techStack, codeHealthScore, improvements, stars, forks, contributors, recentCommits, owner, repoName, description, repoUrl: dataRepoUrl } = displayData;

  useEffect(() => { if (dataRepoUrl && !repoUrl) setRepoUrl(dataRepoUrl); }, [dataRepoUrl, repoUrl]);

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
    } catch (error) { toast.error(error.message, { id: loadingToast }); }
    finally { setIsReanalyzing(false); }
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
            <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full transition"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2"><Github className="w-6 h-6 text-primary" />{owner} / {repoName}</h1>
              <p className="text-xs text-textMuted truncate max-w-md">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <button onClick={handleReanalyze} disabled={isReanalyzing} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${isReanalyzing ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary hover:text-white'}`}>
              <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin' : ''}`} />{isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
            </button>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-warning fill-warning" /><span>{stars}</span></div>
            <div className="flex items-center gap-2"><GitFork className="w-4 h-4 text-accent" /><span>{forks}</span></div>
          </div>
        </div>
      </nav>

      {/* Mobile Tabs */}
      <div className="lg:hidden flex border-b border-white/10 bg-surface/30">
        <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'analysis' ? 'text-primary border-b-2 border-primary' : 'text-textMuted'}`}><BarChart3 size={16} /> Analysis</button>
        <button onClick={() => setActiveTab('chat')} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary' : 'text-textMuted'}`}><MessageSquare size={16} /> AI Chat</button>
      </div>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Analysis (8 cols) */}
          <div className={`lg:col-span-8 space-y-6 ${activeTab === 'chat' ? 'hidden lg:block' : 'block'}`}>
            
            {/* Top Row: Compact Score + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Compact Score Card */}
              <div className="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center justify-center bg-gradient-to-br from-surface/50 to-surface/30">
                <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-3">Health Score</h3>
                <div className="w-24 h-24 relative">
                  <CircularProgressbar value={codeHealthScore} text={`${codeHealthScore}`} styles={buildStyles({ pathColor: scoreColor, textColor: '#fff', trailColor: '#2d2d44', textSize: '28px', strokeWidth: 12 })} />
                </div>
                <p className="mt-2 text-xs font-medium text-textMuted">{codeHealthScore >= 80 ? "Excellent" : codeHealthScore >= 50 ? "Good" : "Needs Work"}</p>
              </div>

              {/* Summary Text */}
              <div className="md:col-span-2 glass rounded-2xl p-6 border border-white/5 space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">What This Repo Does</h3>
                  <p className="text-sm text-textMain leading-relaxed">{getFunctionalSummary()}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-success uppercase tracking-wider mb-1">Use Case</h3>
                  <p className="text-sm text-textMain leading-relaxed">{getUseCase()}</p>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {techStack?.slice(0, 6).map((tech, i) => (
                    <span key={i} className="px-2 py-1 bg-surface border border-primary/20 rounded-md text-[10px] text-primary font-mono">{tech}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 5 Improvements Grid */}
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning"/> Key Improvements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {improvements && improvements.length > 0 ? (
                  improvements.slice(0, 6).map((imp, i) => (
                    <div key={i} className="flex gap-3 p-4 bg-surface/40 rounded-xl border border-white/5 hover:border-primary/30 transition duration-300">
                      <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-textMuted leading-relaxed">{imp}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-textMuted col-span-2">No improvements generated.</p>
                )}
              </div>
            </div>

            {/* Commits & Contributors Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Commits */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Terminal className="w-5 h-5 text-accent"/> Recent Activity</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {recentCommits && recentCommits.length > 0 ? (
                    recentCommits.slice(0, 6).map(c => (
                      <div key={c.sha} className="flex items-start gap-3 pb-2 border-b border-white/5 last:border-0">
                        <img src={c.avatar} alt={c.author} className="w-6 h-6 rounded-full border border-white/10" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{c.message}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-textMuted">{c.author}</span>
                            <span className="text-[10px] text-primary font-mono bg-primary/10 px-1 rounded">{c.sha.substring(0,6)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : <p className="text-textMuted text-sm">No commits found.</p>}
                </div>
              </div>

              {/* Top Contributors */}
              <div className="glass rounded-2xl p-6 border border-white/5">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Trophy className="w-5 h-5 text-warning"/> Top Contributors</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {contributors && contributors.length > 0 ? (
                    contributors.slice(0, 6).map((c, i) => (
                      <div key={c.login} className="flex items-center justify-between p-2 bg-surface/30 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-textMuted w-4">#{i+1}</span>
                          <img src={c.avatar_url} alt={c.login} className="w-8 h-8 rounded-full border border-primary/30" />
                          <span className="text-sm font-medium text-white">{c.login}</span>
                        </div>
                        <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded-full">{c.contributions} commits</span>
                      </div>
                    ))
                  ) : <p className="text-textMuted text-sm">No contributors found.</p>}
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Chat (4 cols) */}
          <div className={`lg:col-span-4 ${activeTab === 'analysis' ? 'hidden lg:block' : 'block'}`}>
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