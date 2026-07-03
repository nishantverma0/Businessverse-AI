import { motion } from "framer-motion";

export function Skeleton({ className = "", style }) {
  return <div className={`skeleton shimmer ${className}`} style={style} />;
}

export function PanelHeader({ title, subtitle, right }) {
  return (
    <div className="panel-header">
      <div>
        <div className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{title}</div>
        {subtitle && <div className="font-mono text-[10.5px] mt-0.5" style={{ color: "var(--text-3)" }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-3">
      {Icon && (
        <div className="w-12 h-12 rounded-xl grid place-items-center"
             style={{ background: "rgba(91,141,239,0.10)", border: "1px solid rgba(91,141,239,0.25)" }}>
          <Icon size={20} color="#5B8DEF" strokeWidth={1.5} />
        </div>
      )}
      <div className="text-[14px] font-medium" style={{ color: "var(--text)" }}>{title}</div>
      {hint && <div className="text-[12.5px] max-w-sm" style={{ color: "var(--text-3)" }}>{hint}</div>}
      {action}
    </div>
  );
}

export function StaggerCol({ children, delay = 0 }) {
  return (
    <motion.div
      initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05, delayChildren: delay } } }}
      className="contents"
    >
      {children}
    </motion.div>
  );
}

export const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.2, 0.7, 0.2, 1] } },
};
