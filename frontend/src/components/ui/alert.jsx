import React from 'react';

export function Alert({ className = '', variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-slate-50 border-slate-200 text-slate-800',
    destructive: 'bg-rose-50 border-rose-200 text-rose-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <div
      role="alert"
      className={`relative w-full rounded-2xl border p-4 text-xs font-semibold shadow-xs ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className = '', children, ...props }) {
  return (
    <h5 className={`mb-1 font-bold leading-none tracking-tight ${className}`} {...props}>
      {children}
    </h5>
  );
}

export function AlertDescription({ className = '', children, ...props }) {
  return (
    <div className={`text-xs [&_p]:leading-relaxed ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Alert;
