import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '🍽️',
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
      <div className="w-18 h-18 rounded-3xl bg-[#FFF2E8] flex items-center justify-center text-3xl mb-4 shadow-xs">
        {icon}
      </div>
      <h3 className="text-xl font-extrabold text-[#291D15] tracking-tight">{title}</h3>
      <p className="text-sm text-[#786455] max-w-sm mt-1.5 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
