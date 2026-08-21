import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";

interface ActionFeedbackProps {
  visible: boolean;
  message: string;
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({ visible, message }) => {
  return (
    <AnimatePresence>
      {visible && message ? (
        <motion.div
          id="action-feedback-toast"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.95 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-3 px-6 py-3.5 rounded-full bg-[#2D241E] text-white shadow-2xl border border-white/10 text-sm font-medium backdrop-blur-md">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
            <span className="font-sans leading-none">{message}</span>
            <div className="h-3.5 w-[1px] bg-white/20 mx-1" />
            <span className="text-[10px] tracking-tight text-white/50">نجاح</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ActionFeedback;
