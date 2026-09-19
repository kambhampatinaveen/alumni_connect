import React from 'react';

export function Input({ className = '', type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
      {...props}
    />
  );
}

export default Input;
