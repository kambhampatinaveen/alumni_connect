import React from 'react';

export function Avatar({ className = '', children, ...props }) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = '', className = '', ...props }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-square h-full w-full object-cover ${className}`}
      {...props}
    />
  );
}

export function AvatarFallback({ className = '', children, ...props }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-[#0F4C81] text-xs font-bold text-white uppercase ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
