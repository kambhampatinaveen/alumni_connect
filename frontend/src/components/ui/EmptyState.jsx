import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = "No Data Available", description = "There are no records matching your request." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 w-full bg-slate-800/20 border border-slate-700/40 rounded-xl text-center">
      <div className="p-3 bg-slate-800 rounded-full mb-3 text-slate-500">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}
