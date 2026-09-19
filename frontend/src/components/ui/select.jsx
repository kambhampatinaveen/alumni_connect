import React from 'react';

export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative w-full">
      <select
        className={`flex h-10 w-full appearance-none rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export default Select;
