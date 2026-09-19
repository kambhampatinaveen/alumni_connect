import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message = "Failed to load data.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 w-full bg-red-950/30 border border-red-800/40 rounded-xl text-center">
      <div className="p-3 bg-red-900/40 rounded-full mb-3 text-red-400">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-red-200 mb-1">Data Retrieval Error</h3>
      <p className="text-sm text-red-400/90 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium text-xs rounded-lg transition-colors shadow-lg shadow-red-900/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Request
        </button>
      )}
    </div>
  );
}
