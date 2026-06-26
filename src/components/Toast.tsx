import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertOctagon, AlertTriangle, X } from 'lucide-react';
import { useToastStore, ToastMessage } from '../store/toastStore';

const ToastIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'success':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    case 'error':
      return <AlertOctagon className="w-5 h-5 text-red-500 shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
    default:
      return null;
  }
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: (id: string) => void }> = ({ toast, onClose }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md min-w-[320px] max-w-[420px] pointer-events-auto
        ${
          toast.type === 'success'
            ? 'bg-white/95 dark:bg-brand-surface-dark/95 border-emerald-100 dark:border-emerald-950/40 text-brand-text-light dark:text-brand-text-dark'
            : toast.type === 'error'
            ? 'bg-white/95 dark:bg-brand-surface-dark/95 border-red-100 dark:border-red-950/40 text-brand-text-light dark:text-brand-text-dark'
            : 'bg-white/95 dark:bg-brand-surface-dark/95 border-amber-100 dark:border-amber-950/40 text-brand-text-light dark:text-brand-text-dark'
        }`}
    >
      <ToastIcon type={toast.type} />
      <span className="text-sm font-medium font-cairo flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="text-brand-muted-light dark:text-brand-muted-dark hover:text-brand-text-light dark:hover:text-brand-text-dark transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((item) => (
          <ToastItem key={item.id} toast={item} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
