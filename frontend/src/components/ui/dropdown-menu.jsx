import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const DropdownMenuContext = createContext(null);

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left" ref={containerRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children, className = '' }) {
  const { open, setOpen } = useContext(DropdownMenuContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        setOpen(!open);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`inline-flex items-center justify-center focus:outline-none cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({ align = 'right', className = '', children }) {
  const { open } = useContext(DropdownMenuContext);
  if (!open) return null;

  const alignStyles = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div
      className={`absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95 duration-100 ${alignStyles} ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ onClick, className = '', children, destructive = false }) {
  const { setOpen } = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer ${
        destructive
          ? 'text-rose-600 hover:bg-rose-50'
          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator({ className = '' }) {
  return <div className={`my-1 h-px bg-slate-100 ${className}`} />;
}

export function DropdownMenuLabel({ className = '', children }) {
  return (
    <div className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 ${className}`}>
      {children}
    </div>
  );
}
