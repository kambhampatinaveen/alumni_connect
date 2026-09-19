import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, className = '', children }) {
  const [currentValue, setCurrentValue] = useState(defaultValue);
  const activeValue = value !== undefined ? value : currentValue;
  const changeValue = onValueChange || setCurrentValue;

  return (
    <TabsContext.Provider value={{ activeValue, changeValue }}>
      <div className={`space-y-4 ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children }) {
  return (
    <div className={`inline-flex items-center justify-center rounded-2xl bg-white p-1.5 border border-slate-200 shadow-xs gap-1.5 ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className = '', children, disabled = false }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeValue === value;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => context.changeValue(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all focus:outline-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 ${
        isActive
          ? 'bg-[#0F4C81] text-white shadow-xs'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = '', children }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeValue !== value) return null;

  return <div className={`focus:outline-none ${className}`}>{children}</div>;
}
