import React from 'react';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';

export const NotFoundPage: React.FC<{ onReturnToHome: () => void }> = ({ onReturnToHome }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 space-y-4">
      <div className="w-20 h-20 rounded-3xl bg-[#FFF2E8] text-[#EA580C] flex items-center justify-center text-4xl shadow-xs">
        🥪
      </div>
      <h1 className="text-4xl font-black text-[#291D15] tracking-tight">404 - Page Not Found</h1>
      <p className="text-sm text-[#786455] max-w-md">
        Looks like this page got eaten by late-night hostel cravings!
      </p>
      <button
        onClick={onReturnToHome}
        className="mt-4 flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Papi's Kitchen</span>
      </button>
    </div>
  );
};
