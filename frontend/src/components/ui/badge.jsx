import React from 'react';

export function statusClass(status = '') {
  const s = String(status).toLowerCase();
  switch (s) {
    case 'active':
    case 'accepted':
    case 'hired':
    case 'completed':
    case 'approved':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-300';
    case 'pending':
    case 'requested':
    case 'in_progress':
    case 'reviewing':
    case 'interview':
    case 'interviewing':
      return 'bg-amber-50 text-amber-800 border border-amber-300';
    case 'shortlisted':
      return 'bg-blue-50 text-blue-800 border border-blue-300';
    case 'selected':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-300';
    case 'rejected':
    case 'declined':
    case 'cancelled':
    case 'inactive':
    case 'expired':
      return 'bg-rose-50 text-rose-800 border border-rose-300';
    case 'upcoming':
      return 'bg-indigo-50 text-indigo-800 border border-indigo-300';
    default:
      return 'bg-slate-100 text-slate-800 border border-slate-300';
  }
}

export function Badge({ className = '', variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-[#0F4C81]/10 text-[#0F4C81] border-[#0F4C81]/30',
    secondary: 'bg-slate-100 text-slate-800 border-slate-300',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    danger: 'bg-rose-50 text-rose-800 border-rose-300',
  };

  const variantClass = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
