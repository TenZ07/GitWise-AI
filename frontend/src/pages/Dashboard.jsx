import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Github, Star, GitFork, Users, FileCode, AlertTriangle, CheckCircle, Terminal } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { repoData } = location.state || {};

  if (!repoData) {
    return (
      <div className="min-h-screen bg-bg text-white flex flex-col items-center justify-center">
        <h2 className="text-2xl text-danger mb-4">No Repository Data Found</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 bg-primary rounded-lg hover:bg-primaryHover transition"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  // --- SMART DATA EXTRACTION ---
  // Try multiple possible keys the AI might have used
  const getFunctionalSummary = () => {
    return repoData.functionalSummary || 
           repoData.summary || 
           repoData.architecture || 
           repoData.aiSummary || 
           "No functional summary available.";
  };

  const getUseCase = () => {
    return repoData.targetAudienceAndUse || 
           repoData.useCaseSummary || 
           repoData.useCase || 
           repoData.purpose || 
           "Based on the tech stack (" + (repoData.techStack?.slice(0,2).join(", ") || "Unknown") + "), this project is likely used by developers to build modern web applications, automate workflows, or serve as a starter template for similar architectures.";
  };
  // -----------------------------

  const functionalSummary = getFunctionalSummary();
  const useCaseText = getUseCase();
  
  const { 
    techStack, 
    codeHealthScore, 
    improvements, 
    stars, 
    forks, 
    contributors, 
    recentCommits, 
    owner, 
    repoName, 
    description 
  } = repoData;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const scoreColor = getScoreColor(codeHealthScore);

  return (
    <div className="min-h-screen bg-bg text-textMain pb-20">
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Summary Card */}
          <div className="lg:col-span-2 glass rounded-2xl p-6 border border-white/5 shadow-xl space-y-6">
            
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <FileCode className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">AI Analysis</h2>
            </div>

            {/* 1. What It Does */}
            <div>
              <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-2">
                What This Repo Does
              </h3>
              <p className="text-textMain leading-relaxed text-base bg-surface/30 p-4 rounded-xl border-l-4 border-primary">
                {functionalSummary}
              </p>
            </div>

            {/* 2. What It Is Used For */}
            <div>
              <h3 className="text-sm font-semibold text-success uppercase tracking-wider mb-2">
                What It Is Used For
              </h3>
              <p className="text-textMain leading-relaxed text-base bg-surface/30 p-4 rounded-xl border-l-4 border-success">
                {useCaseText}
              </p>
            </div>

            {/* Tech Stack */}
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