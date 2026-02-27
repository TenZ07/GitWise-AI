import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';

const ChatBox = ({ repoUrl }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "👋 Hi! I've analyzed this repository. Ask me about its architecture, risks, tech stack, or how to improve the code!" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !repoUrl) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/api/repo/chat', {
        repoUrl,
        message: userMsg.content
        // Model is handled by backend env variable
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "❌ Error: Could not connect to AI. Please ensure the backend is running and API keys are set." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/30 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-surface/50 backdrop-blur-md flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg">
          <Bot className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-white">GitWise Architect</h3>
          <p className="text-xs text-textMuted">Powered by OpenRouter</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-primary' : 'bg-accent'
            }`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
              msg.role === 'user' 
                ? 'bg-primary/20 text-white border border-primary/30 rounded-tr-none' 
                : 'bg-bg/50 text-textMuted border border-white/5 rounded-tl-none'
            }`}>
              <ReactMarkdown 
                components={{
                  code({node, inline, className, children, ...props}) {
                    return !inline ? (
                      <code className="block bg-black/50 p-3 rounded-lg my-2 text-xs font-mono text-green-400 overflow-x-auto" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="bg-black/30 px-1.5 py-0.5 rounded text-xs font-mono text-accent" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-white" />
            </div>
            <div className="bg-bg/50 border border-white/5 p-4 rounded-2xl rounded-tl-none text-textMuted text-sm">
              Analyzing repository context...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-surface/50 backdrop-blur-md">
        <div className="relative flex items-end gap-2 bg-bg/50 border border-white/10 rounded-xl p-2 focus-within:border-primary/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about risks, architecture, or files..."
            rows={1}
            className="w-full bg-transparent border-none outline-none text-white text-sm resize-none max-h-32 py-2 px-2 custom-scrollbar"
            style={{ minHeight: '40px' }}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="p-2 bg-primary hover:bg-primaryHover text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-[10px] text-textMuted mt-2 text-center">
          AI can make mistakes. Verify critical code suggestions.
        </p>
      </div>
    </div>
  );
};

export default ChatBox;