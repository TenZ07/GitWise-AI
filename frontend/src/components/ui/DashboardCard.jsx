const DashboardCard = ({ children, className = "" }) => {
  return (
    <div
      className={`glass rounded-2xl p-6 border border-white/5 
      bg-gradient-to-br from-surface/60 to-surface/30
      hover:border-primary/30 transition-all duration-300
      ${className}`}
    >
      {children}
    </div>
  );
};

export default DashboardCard;