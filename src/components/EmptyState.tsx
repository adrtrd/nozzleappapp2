import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  actionLabel, 
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border border-dashed border-brand-border-light dark:border-brand-border-dark bg-white dark:bg-brand-surface-dark/40 backdrop-blur-sm">
      <div className="w-16 h-16 bg-brand-surface-light dark:bg-brand-bg-dark rounded-2xl flex items-center justify-center text-brand-muted-light dark:text-brand-muted-dark mb-4 border border-brand-border-light dark:border-brand-border-dark">
        {icon || <Inbox className="w-8 h-8" />}
      </div>
      
      <h3 className="text-lg font-bold text-brand-text-light dark:text-brand-text-dark font-cairo mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-brand-muted-light dark:text-brand-muted-dark font-cairo max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-brand-accent-light dark:hover:bg-brand-accent-light/90 text-white text-sm font-semibold font-cairo shadow-lg shadow-indigo-600/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
