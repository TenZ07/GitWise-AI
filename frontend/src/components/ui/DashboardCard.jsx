import { motion } from "framer-motion";

const DashboardCard = ({ children, className = "" }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`rounded-2xl border border-white/5 bg-surface/50 backdrop-blur-lg p-5 shadow-lg hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default DashboardCard;