import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, FileWarning, Shield, Key } from 'lucide-react';
import api from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from "framer-motion";

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

  // ✅ Clean up malformed markdown from AI response
  const cleanMarkdown = (text) => {
    if (!text) return '';
    
    return text
      // Fix malformed table separators (---||| → |---|)
      .replace(/\|-+\|+/g, '|---|')
      .replace(/\|-\|/g, '|---|')
      .replace(/\|{2,}/g, '|')
      // Fix extra pipes at end of lines
      .replace(/\|\s*$/gm, '|')
      // Fix missing pipes at start of table rows
      .replace(/^\s*([^|].*\|)/gm, '|$1')
      // Clean up extra backticks
      .replace(/`{4,}/g, '```')
      // Ensure proper spacing in tables
      .replace(/\|(\w)/g, '| $1')
      .replace(/(\w)\|/g, '$1 |');
  };

  // ✅ Custom Markdown Components
  const markdownComponents = {
    // Code Blocks with Syntax Highlighting
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match ? match[1] : 'javascript'}
          PreTag="div"
          customStyle={{
            margin: '12px 0',
            borderRadius: '8px',
            fontSize: '12px',
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(152, 251, 203, 0.2)',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-black/40 px-2 py-0.5 rounded text-xs font-mono text-primary border border-primary/20">
          {children}
        </code>
      );
    },

    // Tables with Proper Styling
    table({ children }) {
      return (
        <div className="overflow-x-auto my-4 rounded-lg border border-primary/20">
          <table className="w-full text-left border-collapse">
            {children}
          </table>
        </div>
      );
    },

    thead({ children }) {
      return (
        <thead className="bg-primary/10 border-b border-primary/30">
          {children}
        </thead>
      );
    },

    tbody({ children }) {
      return <tbody className="divide-y divide-white/5 bg-bg/30">{children}</tbody>;
    },

    tr({ children }) {
      return <tr className="hover:bg-primary/5 transition">{children}</tr>;
    },

    th({ children }) {
      return (
        <th className="px-4 py-3 text-xs font-semibold text-primary uppercase tracking-wider border-r border-white/5 last:border-none">
          {children}
        </th>
      );
    },

    td({ children }) {
      return (
        <td className="px-4 py-3 text-sm text-textMuted border-r border-white/5 last:border-none">
          {children}
        </td>
      );
    },

    // Better List Styling
    ul({ children }) {
      return <ul className="list-disc list-inside space-y-1.5 my-3 text-textMuted pl-2">{children}</ul>;
    },

    ol({ children }) {
      return <ol className="list-decimal list-inside space-y-1.5 my-3 text-textMuted pl-2">{children}</ol>;
    },

    li({ children }) {
      return <li className="pl-1 leading-relaxed">{children}</li>;
    },

    // Better Heading Styling
    h1({ children }) {
      return <h1 className="text-lg font-bold text-white mt-4 mb-2 flex items-center gap-2">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-base font-semibold text-primary mt-3 mb-2 flex items-center gap-2">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-sm font-semibold text-accent mt-2 mb-1">{children}</h3>;
    },

    // Better Paragraph Spacing
    p({ children }) {
      return <p className="text-sm text-textMuted leading-relaxed my-2">{children}</p>;
    },

    // Better Link Styling
    a({ href, children }) {
      return (
        <a 
          href={href} 
          className="text-primary hover:text-accent underline underline-offset-2 transition"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    },

    // Blockquote for Warnings/Notes
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-primary/50 bg-primary/5 pl-4 py-3 my-3 rounded-r-lg text-sm text-textMuted">
          {children}
        </blockquote>
      );
    },

    // Strong/Bold Text
    strong({ children }) {
      return <strong className="text-white font-semibold">{children}</strong>;
    },
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
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, idx) => {
          const cleanedContent = cleanMarkdown(msg.content);
          
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-primary' : 'bg-accent'
              }`}>
                {msg.role === 'user' ? <User size={16} className="text-bg" /> : <Bot size={16} className="text-bg" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[92%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg overflow-hidden ${
                msg.role === 'user' 
                  ? 'bg-primary/20 text-white border border-primary/30 rounded-tr-none' 
                  : 'bg-bg/50 text-textMuted border border-white/5 rounded-tl-none'
              }`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} // ✅ Enable GitHub Flavored Markdown (tables!)
                  components={markdownComponents}
                >
                  {cleanedContent}
                </ReactMarkdown>
              </div>
            </motion.div>
          );
        })}
        
        {loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-bg" />
            </div>
            <div className="bg-bg/50 border border-white/5 p-4 rounded-2xl rounded-tl-none text-textMuted text-sm flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              GitWise AI is thinking...
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-surface/50 backdrop-blur-md">
        <div className="relative flex items-center gap-3 bg-bg/50 border border-white/10 rounded-xl px-4 py-3 focus-within:border-primary/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about risks, architecture, or files..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none text-white text-sm resize-none max-h-32 py-1 custom-scrollbar placeholder:text-textMuted/50"
            style={{ minHeight: '24px' }}
            disabled={loading}
          />
          
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="flex items-center justify-center w-10 h-10 bg-primary hover:bg-primaryHover text-bg rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 group"
          >
            <Send size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
        <p className="text-[10px] text-textMuted/60 mt-2 text-center">
          GitWise AI can make mistakes. Verify critical code suggestions.
        </p>
      </div>
    </div>
  );
};

export default ChatBox;