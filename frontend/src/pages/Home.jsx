import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Github, Loader2, Sparkles } from "lucide-react";
import { analyzeRepo } from "../services/api";
import toast, { Toaster } from "react-hot-toast";

const Home = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      const repoData =
        result.savedRepo || result.existingRepo || result.data;

      if (!repoData) throw new Error("No data returned");

      toast.success(
        result.cached ? "Loaded from cache ⚡" : "Repository analyzed"
      );

      navigate("/dashboard", { state: { repoData } });
    } catch (error) {
      let msg = "Failed to analyze repository";

      if (error.code === "ERR_NETWORK")
        msg = "Backend server not reachable";

      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">

      <Toaster position="top-center" />

      {/* Neural Grid Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* AI Glow Core */}
      <div className="absolute w-[600px] h-[600px] bg-primary/20 blur-[200px] rounded-full top-[-20%]" />
      <div className="absolute w-[600px] h-[600px] bg-purple-500/20 blur-[200px] rounded-full bottom-[-20%]" />

      {/* GitHub Floating Button */}
      <a
        href="https://github.com/TenZ07"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 left-8 z-50 group"
      >
        <div className="relative">
          <div className="absolute inset-0 blur-lg bg-gradient-to-r from-primary to-purple-500 opacity-60 rounded-full group-hover:opacity-100 transition" />

          <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-white/5 border border-white/10 backdrop-blur-lg group-hover:scale-110 transition">
            <Github className="w-6 h-6 text-white" />
          </div>
        </div>
      </a>

      {/* Main UI */}
      <div className="relative z-10 text-center max-w-2xl space-y-12 px-6">

        {/* Title */}
        <div className="space-y-6">

          <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
            <Sparkles size={14} />
            AI Repository Intelligence
          </div>

          <h1 className="text-6xl font-bold tracking-tight">
            GitWise
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              {" "}AI
            </span>
          </h1>

          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            Understand any GitHub repository instantly with AI-powered
            architecture analysis and code intelligence.
          </p>

        </div>

        {/* Command Input */}
        <form
          onSubmit={handleSubmit}
          className="relative group"
        >

          <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 blur opacity-20 rounded-2xl group-hover:opacity-40 transition" />

          <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="paste github repository url..."
              className="flex-1 px-6 py-5 bg-transparent outline-none text-lg placeholder:text-gray-500"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-8 py-5 bg-primary text-white font-medium hover:bg-primaryHover transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  scanning
                </>
              ) : (
                <>
                  analyze
                  <Sparkles size={18}/>
                </>
              )}
            </button>

          </div>

        </form>

        {/* AI Scan Status */}
        {loading && (
          <div className="text-sm text-primary animate-pulse space-y-1">

            <p>scanning repository structure...</p>
            <p>reading source files...</p>
            <p>generating architecture insights...</p>

          </div>
        )}

        {/* Minimal Feature Row */}
        <div className="flex justify-center gap-10 text-sm text-gray-400 pt-6">

          <span className="hover:text-white transition">
            architecture analysis
          </span>

          <span className="hover:text-white transition">
            code health score
          </span>

          <span className="hover:text-white transition">
            AI improvements
          </span>

        </div>

      </div>

    </div>
  );
};

export default Home;