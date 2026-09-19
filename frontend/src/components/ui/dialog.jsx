import React from 'react';
import { X } from 'lucide-react';

export function Dialog({ open, onOpenChange, children, className = '' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={() => onOpenChange && onOpenChange(false)}
      />
      {/* Dialog Box */}
      <div
        className={`relative z-50 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange && onOpenChange(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className = '', children, ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 text-left mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ className = '', children, ...props }) {
  return (
    <h3 className={`text-xl font-bold leading-none tracking-tight text-slate-900 ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function DialogDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-sm text-slate-500 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function DialogContent({ className = '', children, ...props }) {
  return (
    <div className={`py-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogFooter({ className = '', children, ...props }) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 mt-6 pt-4 border-t border-slate-100 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Dialog;
