import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Loader2, Sparkles, ArrowRight, Code2, Shield, Zap, Stars } from "lucide-react";
import { analyzeRepo } from "../services/api";
import toast, { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

const Home = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url || typeof url !== "string") {
      toast.error("Enter a repository URL");
      return;
    }

    const cleanUrl = url.trim();

    if (!cleanUrl.includes("github.com")) {
      toast.error("Invalid GitHub repository");
      return;
    }

    setLoading(true);

    try {
      const result = await analyzeRepo(cleanUrl);

      const repoData = result.savedRepo || result.existingRepo || result.data;

      if (!repoData) throw new Error("No data returned");

      toast.success(result.cached ? "Loaded from cache ⚡" : "Repository analyzed ✨");

      navigate("/dashboard", { state: { repoData } });
    } catch (error) {
      let msg = "Failed to analyze repository";

      if (error.code === "ERR_NETWORK") msg = "Backend server not reachable";
      if (error.message) msg = error.message;

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const features = [
    { icon: Code2, title: "Architecture Analysis", desc: "Deep dive into code structure" },
    { icon: Shield, title: "Security Scan", desc: "Identify vulnerabilities instantly" },
    { icon: Zap, title: "Performance Check", desc: "Optimize your codebase" },
    { icon: Stars, title: "AI Improvements", desc: "Smart suggestions powered by Groq" },
  ];

  return (
    <div className="min-h-screen bg-bg text-textMain relative overflow-hidden">
      <Toaster position="top-center" />

      {/* 🌟 Animated Background */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/20 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent/20 blur-[150px] rounded-full"
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(152,251,203,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(152,251,203,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        
        {/* Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg via-transparent to-bg" />
      </div>

      {/* 🔘 GitHub Profile Button */}
      <motion.a
        href="https://github.com/TenZ07"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed top-6 right-6 z-50 group"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-lg opacity-50 group-hover:opacity-100 transition duration-500" />
          <div className="relative flex items-center gap-3 px-4 py-2.5 bg-surface/80 backdrop-blur-xl border border-primary/30 rounded-full hover:border-primary/60 transition duration-300">
            <Github className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-textMuted group-hover:text-primary transition">TenZ07</span>
          </div>
        </div>
      </motion.a>

      {/* 📱 Main Content */} 
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={mounted ? "show" : "hidden"}
          className="max-w-4xl w-full text-center space-y-12"
        >
          {/* 🏷️ Badge */}
          <motion.div variants={itemVariants}>
            <div>
            </div>
            <div/>
          </motion.div>

          {/* 🎯 Hero Title */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight">
              <span className="text-textMain">Understand Any</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                Codebase Instantly
              </span>
            </h1>
            <p className="text-lg text-textMuted max-w-2xl mx-auto leading-relaxed">
              Get AI-powered architecture analysis, security insights, and actionable improvements 
              for any GitHub repository in seconds.
            </p>
          </motion.div>

          {/* 📥 Input Form */}
          <motion.div variants={itemVariants} className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary blur-xl opacity-20 group-hover:opacity-40 transition duration-500 rounded-2xl" />
              
              {/* Input Container */}
              <div className="relative flex items-center bg-surface/80 backdrop-blur-xl border border-primary/20 rounded-2xl overflow-hidden hover:border-primary/40 transition duration-300">
                <div className="pl-5 text-textMuted">
                  <Github className="w-5 h-5" />
                </div>
                
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/username/repository"
                  className="flex-1 px-4 py-5 bg-transparent outline-none text-base text-textMain placeholder:text-textMuted/50"
                  disabled={loading}
                />
                
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="m-2 px-6 py-3 bg-primary hover:bg-primaryHover text-bg font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group/btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze</span>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>

              {/* Loading Status */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-sm text-primary space-y-1"
                >
                  <p className="animate-pulse">🔍 Scanning repository structure...</p>
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* ✨ Features Grid */}
          <motion.div variants={itemVariants} className="pt-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group p-4 bg-surface/50 backdrop-blur-sm border border-white/5 rounded-xl hover:border-primary/30 transition duration-300"
                >
                  <div className="w-10 h-10 mx-auto mb-3 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold text-textMain mb-1">{feature.title}</h3>
                  <p className="text-[10px] text-textMuted">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>          
        </motion.div>
      </div>

      {/* 🌊 Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none" />
    </div>
  );
};

export default Home;