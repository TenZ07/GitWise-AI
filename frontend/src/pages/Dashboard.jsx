import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, Star, GitFork, Users, FileCode, AlertTriangle, CheckCircle, Terminal, RefreshCw, Loader2, MessageSquare, BarChart3, Trophy, Shield, Zap, Code2, TrendingUp, Award, BookOpen } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { analyzeRepo } from '../services/api';
import ChatBox from '../components/ChatBox';
import DashboardCard from "../components/ui/DashboardCard";


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

  // ✅ Helper to get Groq data (supports both root level and nested for compatibility)
  const getGroqData = (field) => {
    return displayData[field] || displayData.codeAnalysis?.[field];
  };

  return (
    <div className="min-h-screen bg-bg text-textMain pb-20">
      <Toaster position="top-center" />
      
      {/* Floating GitHub Button */}
      <a 
        href="https://github.com/TenZ07"
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 left-8 z-50 group"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-accent rounded-full blur-lg opacity-60 group-hover:opacity-100 animate-pulse transition-opacity duration-300"></div>
          <div className="relative flex items-center gap-3 px-6 py-3 bg-surface border border-white/10 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 group-hover:scale-110 group-hover:border-primary/50">
            <Github className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
          </div>
        </div>
      </a>
      
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
            
            {/* Top Row: Profile + Score + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Profile + Health Score */}
              <div className="flex flex-col gap-6">
                {/* Profile Card */}
                <DashboardCard className="flex flex-col items-center justify-center group cursor-pointer">
                  <a 
                    href={`https://github.com/${owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center"
                  >
                  <div className="relative mb-3">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <img 
                      src={`https://github.com/${owner}.png`} 
                      alt={owner}
                      className="w-20 h-20 rounded-full border-2 border-primary/30 group-hover:border-primary transition-all duration-300 relative z-10"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{owner}</h3>
                  <p className="text-xs text-primary group-hover:text-accent transition-colors duration-300">View Profile</p>
                  </a>
                </DashboardCard>

                {/* Health Score Card */}
                <DashboardCard className="flex flex-col items-center justify-center relative overflow-hidden">
                  {/* subtle glow behind the circle */}
                  <div
                    className="absolute inset-0 opacity-20 blur-2xl"
                    style={{ background: `radial-gradient(circle at center, ${scoreColor} 0%, transparent 60%)` }}
                  />

                  <h3 className="text-sm font-bold text-textMuted uppercase tracking-wider mb-3 z-10">
                    Health Score
                  </h3>

                  <div className="w-28 h-28 relative z-10">
                    <CircularProgressbar
                      value={codeHealthScore}
                      text={`${codeHealthScore}`}
                      styles={buildStyles({
                        pathColor: scoreColor,
                        textColor: "#fff",
                        trailColor: "#2d2d44",
                        textSize: "26px",
                        strokeWidth: 10,
                      })}
                  />
  </div>

  {/* status badge */}
  <span
    className={`mt-3 text-[11px] px-3 py-1 rounded-full font-semibold border ${
      codeHealthScore >= 80
        ? "bg-green-500/10 text-green-400 border-green-500/30"
        : codeHealthScore >= 50
        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
        : "bg-red-500/10 text-red-400 border-red-500/30"
    }`}
  >
    {codeHealthScore >= 80
      ? "Excellent"
      : codeHealthScore >= 50
      ? "Needs Optimization"
      : "High Risk"}
  </span>
</DashboardCard>
              </div>

              {/* Summary Text */}
              <DashboardCard className="md:col-span-2 space-y-4">
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
              </DashboardCard>
              {/* Repository Stats */}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <DashboardCard className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <Star className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Stars</p>
                    <p className="text-xl font-bold text-white">{stars}</p>
                  </div>
                </DashboardCard>

                <DashboardCard className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <GitFork className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Forks</p>
                    <p className="text-xl font-bold text-white">{forks}</p>
                  </div>
                </DashboardCard>

                <DashboardCard className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-textMuted">Contributors</p>
                    <p className="text-xl font-bold text-white">
                      {contributors?.length || 0}
                    </p>
                  </div>
                </DashboardCard>


            </div>
            
            {/* Improvements Grid */}
            <DashboardCard>
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Key Improvements
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {improvements && improvements.length > 0 ? (
                  improvements.slice(0, 6).map((imp, i) => (
                    <div
                      key={i}
                      className="group p-4 rounded-xl border border-white/5 bg-surface/40 hover:border-primary/40 hover:bg-surface/60 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <CheckCircle className="w-4 h-4 text-success mt-1 flex-shrink-0" />

                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20 font-medium">
                          SUGGESTION
                        </span>
                      </div>

                      <p className="text-sm text-textMuted leading-relaxed group-hover:text-textMain transition">
                        {imp}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-textMuted col-span-2">No improvements generated.</p>
                )}
              </div>
            </DashboardCard>

            {/* 🆕 Deep Code Analysis Section (Groq AI) - UPDATED */}
            {(getGroqData('codeQualityInsights') || getGroqData('securityConcerns') || getGroqData('performanceIssues')) && (
              <DashboardCard>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-primary"/> Deep Code Analysis
                  </h3>
                  <span className="text-xs text-textMuted bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    📁 {displayData.filesAnalyzed || getGroqData('analyzedFiles')?.length || 0} files analyzed
                  </span>
                </div>

                {/* Code Quality Insights */}
                {getGroqData('codeQualityInsights') && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4"/> Code Quality
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getGroqData('codeQualityInsights').strengths?.length > 0 && (
                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                          <p className="text-xs font-bold text-success mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3"/> Strengths
                          </p>
                          <ul className="space-y-1.5">
                            {getGroqData('codeQualityInsights').strengths.slice(0, 3).map((s, i) => (
                              <li key={i} className="text-xs text-textMuted leading-relaxed">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {getGroqData('codeQualityInsights').weaknesses?.length > 0 && (
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                          <p className="text-xs font-bold text-warning mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3"/> Weaknesses
                          </p>
                          <ul className="space-y-1.5">
                            {getGroqData('codeQualityInsights').weaknesses.slice(0, 3).map((w, i) => (
                              <li key={i} className="text-xs text-textMuted leading-relaxed">• {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Security Concerns */}
                {getGroqData('securityConcerns')?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-danger mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4"/> Security Concerns
                    </h4>
                    <div className="space-y-2">
                      {getGroqData('securityConcerns').slice(0, 4).map((concern, i) => (
                        <div key={i} className="bg-danger/10 border border-danger/20 rounded-lg p-3 hover:border-danger/40 transition">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-white">{concern.issue}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              concern.severity === 'HIGH' ? 'bg-danger text-white' :
                              concern.severity === 'MEDIUM' ? 'bg-warning text-black' :
                              'bg-gray-600 text-white'
                            }`}>
                              {concern.severity}
                            </span>
                          </div>
                          <p className="text-xs text-textMuted mb-2">{concern.recommendation}</p>
                          <p className="text-[10px] text-primary font-mono bg-primary/10 inline-block px-2 py-0.5 rounded">📁 {concern.file}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Issues */}
                {getGroqData('performanceIssues')?.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-warning mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4"/> Performance Issues
                    </h4>
                    <div className="space-y-2">
                      {getGroqData('performanceIssues').slice(0, 4).map((issue, i) => (
                        <div key={i} className="bg-warning/10 border border-warning/20 rounded-lg p-3 hover:border-warning/40 transition">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-medium text-white">{issue.issue}</p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              issue.impact === 'HIGH' ? 'bg-danger text-white' :
                              issue.impact === 'MEDIUM' ? 'bg-warning text-black' :
                              'bg-gray-600 text-white'
                            }`}>
                              {issue.impact}
                            </span>
                          </div>
                          <p className="text-xs text-textMuted mb-2">{issue.solution}</p>
                          <p className="text-[10px] text-primary font-mono bg-primary/10 inline-block px-2 py-0.5 rounded">📁 {issue.file}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Architecture Patterns */}
                {getGroqData('architecturePatterns') && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4"/> Architecture Patterns
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <p className="text-xs font-bold text-primary mb-2">✓ Detected</p>
                        <div className="flex flex-wrap gap-2">
                          {getGroqData('architecturePatterns').detected?.slice(0, 4).map((p, i) => (
                            <span key={i} className="text-[10px] px-2 py-1 bg-primary/20 text-primary rounded-full font-medium">{p}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-surface/50 border border-white/5 rounded-lg p-4">
                        <p className="text-xs font-bold text-textMuted mb-2">💡 Recommendations</p>
                        <ul className="space-y-1">
                          {getGroqData('architecturePatterns').recommendations?.slice(0, 2).map((r, i) => (
                            <li key={i} className="text-xs text-textMuted">• {r}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Best Practices */}
                {getGroqData('bestPractices') && (
                  <div>
                    <h4 className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4"/> Best Practices
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getGroqData('bestPractices').followed?.length > 0 && (
                        <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                          <p className="text-xs font-bold text-success mb-2">✓ Followed</p>
                          <ul className="space-y-1">
                            {getGroqData('bestPractices').followed.slice(0, 3).map((p, i) => (
                              <li key={i} className="text-xs text-textMuted">• {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {getGroqData('bestPractices').missing?.length > 0 && (
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                          <p className="text-xs font-bold text-warning mb-2">⚠ Missing</p>
                          <ul className="space-y-1">
                            {getGroqData('bestPractices').missing.slice(0, 3).map((p, i) => (
                              <li key={i} className="text-xs text-textMuted">• {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DashboardCard>
            )}

            {/* Commits & Contributors Split */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Commits */}
              <DashboardCard>
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
              </DashboardCard>

              {/* Top Contributors */}
              <DashboardCard>
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
              </DashboardCard>
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