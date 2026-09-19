import React from 'react';

export function Label({ className = '', children, ...props }) {
  return (
    <label
      className={`text-xs font-bold text-slate-700 tracking-wide select-none ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}

export default Label;
