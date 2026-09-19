import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = "Loading platform data...", size = "md" }) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-8 h-8",
    lg: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full h-48 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
      <Loader2 className={`${sizeClasses[size]} text-[#0F4C81] animate-spin mb-3`} />
      <span className="text-xs font-bold text-slate-600">{message}</span>
    </div>
  );
}
