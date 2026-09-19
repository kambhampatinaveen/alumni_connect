import React from 'react';

export function Table({ className = '', ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
  );
}

export function TableHeader({ className = '', ...props }) {
  return <thead className={`[&_tr]:border-b border-slate-200 ${className}`} {...props} />;
}

export function TableBody({ className = '', ...props }) {
  return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />;
}

export function TableFooter({ className = '', ...props }) {
  return (
    <tfoot
      className={`border-t border-slate-200 bg-slate-50 font-medium [&>tr]:last:border-b-0 ${className}`}
      {...props}
    />
  );
}

export function TableRow({ className = '', ...props }) {
  return (
    <tr
      className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 data-[state=selected]:bg-slate-100 ${className}`}
      {...props}
    />
  );
}

export function TableHead({ className = '', ...props }) {
  return (
    <th
      className={`h-10 px-4 text-left align-middle text-xs font-bold uppercase tracking-wider text-slate-500 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
}

export function TableCell({ className = '', ...props }) {
  return (
    <td
      className={`p-4 align-middle text-xs text-slate-700 [&:has([role=checkbox])]:pr-0 ${className}`}
      {...props}
    />
  );
}

export function TableCaption({ className = '', ...props }) {
  return (
    <caption
      className={`mt-4 text-xs text-slate-400 ${className}`}
      {...props}
    />
  );
}
