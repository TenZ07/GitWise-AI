import { motion } from "framer-motion";

/**
 * DashboardCard
 *
 * Props:
 *   children   – content
 *   className  – extra Tailwind classes
 *   variant    – "default" | "flat"  (flat = no hover lift, for tab-host cards)
 *   onClick    – optional click handler
 */
const DashboardCard = ({ children, className = "", variant = "default", onClick }) => {
  const isFlat = variant === "flat";

  return (
    <motion.div
      whileHover={isFlat ? {} : { y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      className={`
        rounded-2xl border border-white/5 bg-surface/50 backdrop-blur-lg p-5
        shadow-lg transition-all duration-300
        ${isFlat ? "" : "hover:border-primary/40 hover:shadow-primary/10"}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default DashboardCard;
