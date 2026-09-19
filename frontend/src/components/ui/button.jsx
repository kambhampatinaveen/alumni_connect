import React from 'react';

export function Button({
  className = '',
  variant = 'default',
  size = 'default',
  type = 'button',
  disabled = false,
  children,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F4C81] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    default: 'bg-[#0F4C81] text-white hover:bg-[#0d3d68] shadow-sm shadow-blue-900/20 active:scale-[0.98]',
    secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 active:scale-[0.98]',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs active:scale-[0.98]',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 active:scale-[0.98]',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 active:scale-[0.98]',
  };

  const sizes = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 rounded-lg px-3 text-xs',
    lg: 'h-12 rounded-xl px-6 text-base',
    icon: 'h-10 w-10 p-2',
  };

  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.default;

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
