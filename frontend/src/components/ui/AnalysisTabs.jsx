import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Shield, Zap, Code2, TrendingUp,
  AlertTriangle, CheckCircle, Award, BookOpen, ChevronRight
} from "lucide-react";
import DashboardCard from "./DashboardCard";

const TABS = [
  { id: "overview",      label: "Overview",      icon: LayoutDashboard, color: "primary"  },
  { id: "security",      label: "Security",       icon: Shield,          color: "danger"   },
  { id: "performance",   label: "Performance",    icon: Zap,             color: "accent"   },
  { id: "architecture",  label: "Architecture",   icon: Code2,           color: "primary"  },
];

const COLOR_MAP = {
  primary: {
    text:   "text-primary",
    border: "border-primary",
    bg:     "bg-primary/10",
    badge:  "bg-primary/10 text-primary border border-primary/30",
    card:   "bg-primary/10 border-primary/30",
    dot:    "bg-primary",
  },
  accent: {
    text:   "text-accent",
    border: "border-accent",
    bg:     "bg-accent/10",
    badge:  "bg-accent/10 text-accent border border-accent/30",
    card:   "bg-accent/10 border-accent/30",
    dot:    "bg-accent",
  },
  danger: {
    text:   "text-danger",
    border: "border-danger",
    bg:     "bg-danger/10",
    badge:  "bg-danger/10 text-danger border border-danger/30",
    card:   "bg-danger/10 border-danger/30",
    dot:    "bg-danger",
  },
};

const SeverityBadge = ({ level }) => {
  const map = {
    HIGH:   "bg-danger text-white",
    MEDIUM: "bg-accent text-black",
    LOW:    "bg-gray-600 text-white",
    CRITICAL: "bg-danger text-white",
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${map[level] || map.LOW}`}>
      {level}
    </span>
  );
};

const IssueCard = ({ title, description, file, severity, accentClass }) => (
  <div className={`rounded-xl border p-3 transition-all hover:brightness-110 ${accentClass}`}>
    <div className="flex items-start justify-between mb-1 gap-2">
      <p className="text-sm font-medium text-white leading-snug">{title}</p>
      {severity && <SeverityBadge level={severity} />}
    </div>
    {description && <p className="text-xs text-textMuted mb-2 leading-relaxed">{description}</p>}
    {file && (
      <span className="text-[10px] text-primary font-mono bg-primary/10 inline-block px-2 py-0.5 rounded border border-primary/20">
        📁 {file}
      </span>
    )}
  </div>
);

const ListCard = ({ title, items, colorClass, icon: Icon }) => (
  <div className={`rounded-xl border p-4 ${colorClass}`}>
    <p className={`text-xs font-bold mb-2 flex items-center gap-1.5 ${colorClass.includes("primary") ? "text-primary" : colorClass.includes("accent") ? "text-accent" : "text-danger"}`}>
      {Icon && <Icon className="w-3 h-3" />} {title}
    </p>
    <ul className="space-y-1.5">
      {items?.slice(0, 4).map((item, i) => (
        <li key={i} className="text-xs text-textMuted leading-relaxed flex gap-1.5">
          <span className="mt-0.5 flex-shrink-0">•</span> {item}
        </li>
      ))}
    </ul>
  </div>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-textMuted">
    <Icon className="w-10 h-10 mb-3 opacity-30" />
    <p className="text-sm">{message}</p>
  </div>
);

const OverviewPanel = ({ data, getGroqData, filesAnalyzed }) => {
  const quality = getGroqData("codeQualityInsights");
  const bestPractices = getGroqData("bestPractices");
  const hasData = quality || bestPractices;

  if (!hasData) return <EmptyState icon={LayoutDashboard} message="No overview data available for this repository." />;

  return (
    <div className="space-y-5">
      {quality && (
        <div>
          <h4 className="text-xs font-semibold text-textMuted uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-accent" /> Code Quality Insights
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quality.strengths?.length > 0 && (
              <ListCard
                title="Strengths"
                items={quality.strengths}
                colorClass="bg-primary/10 border-primary/30"
                icon={CheckCircle}
              />
            )}
            {quality.weaknesses?.length > 0 && (
              <ListCard
                title="Weaknesses"
                items={quality.weaknesses}
                colorClass="bg-accent/10 border-accent/30"
                icon={AlertTriangle}
              />
            )}
          </div>
        </div>
      )}

      {bestPractices && (
        <div>
          <h4 className="text-xs font-semibold text-textMuted uppercase tracking-widest mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-primary" /> Best Practices
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPractices.followed?.length > 0 && (
              <ListCard
                title="✓ Followed"
                items={bestPractices.followed}
                colorClass="bg-primary/10 border-primary/30"
                icon={null}
              />
            )}
            {bestPractices.missing?.length > 0 && (
              <ListCard
                title="⚠ Missing"
                items={bestPractices.missing}
                colorClass="bg-accent/10 border-accent/30"
                icon={null}
              />
            )}
          </div>
        </div>
      )}

      {/* <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-textMuted bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 font-mono">
          📁 {filesAnalyzed || 0} files analyzed
        </span>
      </div> */}
    </div>
  );
};

const SecurityPanel = ({ getGroqData }) => {
  const concerns = getGroqData("securityConcerns");

  if (!concerns?.length) return <EmptyState icon={Shield} message="No security concerns detected — great sign!" />;

  const grouped = {
    HIGH: concerns.filter(c => c.severity === "HIGH" || c.severity === "CRITICAL"),
    MEDIUM: concerns.filter(c => c.severity === "MEDIUM"),
    LOW: concerns.filter(c => !["HIGH", "CRITICAL", "MEDIUM"].includes(c.severity)),
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Critical / High", count: grouped.HIGH.length, color: "text-danger", bg: "bg-danger/10 border-danger/20" },
          { label: "Medium",          count: grouped.MEDIUM.length, color: "text-accent", bg: "bg-accent/10 border-accent/20" },
          { label: "Low",             count: grouped.LOW.length,    color: "text-textMuted", bg: "bg-surface/50 border-white/5" },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${bg}`}>
            <p className={`text-xl font-bold ${color}`}>{count}</p>
            <p className="text-[10px] text-textMuted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {concerns.map((c, i) => (
          <IssueCard
            key={i}
            title={c.issue}
            description={c.recommendation}
            file={c.file}
            severity={c.severity}
            accentClass="bg-danger/10 border-danger/30 hover:border-danger/50"
          />
        ))}
      </div>
    </div>
  );
};

const PerformancePanel = ({ getGroqData }) => {
  const issues = getGroqData("performanceIssues");

  if (!issues?.length) return <EmptyState icon={Zap} message="No performance issues detected." />;

  const high   = issues.filter(i => i.impact === "HIGH").length;
  const medium = issues.filter(i => i.impact === "MEDIUM").length;

  return (
    <div className="space-y-5">
      <div className="flex gap-3 flex-wrap">
        <span className="text-xs px-3 py-1.5 rounded-full bg-danger/10 text-danger border border-danger/20 font-medium">
          {high} High Impact
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
          {medium} Medium Impact
        </span>
        <span className="text-xs px-3 py-1.5 rounded-full bg-surface/50 text-textMuted border border-white/5 font-medium">
          {issues.length - high - medium} Low Impact
        </span>
      </div>

      <div className="space-y-2">
        {issues.map((issue, i) => (
          <IssueCard
            key={i}
            title={issue.issue}
            description={issue.solution}
            file={issue.file}
            severity={issue.impact}
            accentClass="bg-accent/10 border-accent/30 hover:border-accent/50"
          />
        ))}
      </div>
    </div>
  );
};

const ArchitecturePanel = ({ getGroqData }) => {
  const patterns = getGroqData("architecturePatterns");
  const quality  = getGroqData("codeQualityInsights");

  if (!patterns) return <EmptyState icon={Award} message="No architecture data available for this repository." />;

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-xs font-semibold text-textMuted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-primary" /> Architecture Patterns
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patterns.detected?.length > 0 && (
            <ListCard
              title="✓ Detected Patterns"
              items={patterns.detected}
              colorClass="bg-primary/10 border-primary/30"
              icon={null}
            />
          )}
          {patterns.recommendations?.length > 0 && (
            <ListCard
              title="💡 Recommendations"
              items={patterns.recommendations}
              colorClass="bg-surface/50 border-white/5"
              icon={null}
            />
          )}
        </div>
      </div>

      {quality?.dependencies && (
        <div>
          <h4 className="text-xs font-semibold text-textMuted uppercase tracking-widest mb-3 flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-accent" /> Dependencies & Complexity
          </h4>
          <div className="rounded-xl border border-white/5 bg-surface/30 p-4 text-sm text-textMuted leading-relaxed">
            {quality.dependencies}
          </div>
        </div>
      )}

      {patterns.recommendations?.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-textMuted uppercase tracking-widest mb-3 flex items-center gap-2">
            <ChevronRight className="w-3.5 h-3.5 text-accent" /> Suggested Improvement Path
          </h4>
          <ol className="space-y-2">
            {patterns.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-textMuted">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

const AnalysisTabs = ({ displayData, getGroqData }) => {
  const [activeTab, setActiveTab] = useState("overview");

  const hasAnyData =
    getGroqData("codeQualityInsights") ||
    getGroqData("securityConcerns") ||
    getGroqData("performanceIssues") ||
    getGroqData("architecturePatterns");

  if (!hasAnyData) return null;

  const filesAnalyzed = displayData.filesAnalyzed || getGroqData("analyzedFiles")?.length || 0;

  const panelProps = { displayData, getGroqData, filesAnalyzed };

  const panelMap = {
    overview:     <OverviewPanel     {...panelProps} />,
    security:     <SecurityPanel     {...panelProps} />,
    performance:  <PerformancePanel  {...panelProps} />,
    architecture: <ArchitecturePanel {...panelProps} />,
  };

  return (
    <DashboardCard className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-0">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" /> Deep Code Analysis
        </h3>
        <span className="text-xs text-textMuted bg-primary/10 px-3 py-1 rounded-full border border-primary/30">
          📁 {filesAnalyzed} files
        </span>
      </div>

      <div className="flex gap-1 px-5 mt-4 border-b border-white/5 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const c = COLOR_MAP[tab.color];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold
                whitespace-nowrap transition-colors duration-200 flex-shrink-0
                ${isActive ? c.text : "text-textMuted hover:text-white"}
              `}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {isActive && (
                <motion.span
                  layoutId="tab-indicator"
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${c.dot}`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {panelMap[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardCard>
  );
};

export default AnalysisTabs;
