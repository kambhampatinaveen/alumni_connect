import React from 'react';

export function Textarea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`flex w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y ${className}`}
      {...props}
    />
  );
}

export default Textarea;
