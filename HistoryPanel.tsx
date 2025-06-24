import React from 'react';
import type { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onItemClick: (item: HistoryItem) => void;
  onClearHistory: () => void;
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString();
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onItemClick, onClearHistory }) => {
  if (history.length === 0) {
    return (
      <div className="mt-4 bg-slate-800 p-6 rounded-xl shadow-xl text-center">
        <p className="text-slate-400">No search history yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 bg-slate-800 p-4 sm:p-6 rounded-xl shadow-xl max-h-[50vh] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
          Search History
        </h3>
        <button
          onClick={onClearHistory}
          className="px-3 py-1.5 text-xs font-medium text-red-400 bg-slate-700 hover:bg-red-700 hover:text-red-100 rounded-md transition-colors duration-200"
          aria-label="Clear all search history"
        >
          Clear All
        </button>
      </div>
      <ul className="space-y-3">
        {history.map((item) => (
          <li 
            key={item.id} 
            className="bg-slate-700/70 p-3 rounded-lg border border-slate-600 hover:border-pink-500 transition-all duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">
                  {item.mode === 'text' ? 'Text Query' : 'Image Prompt'} - {formatDate(item.timestamp)}
                </p>
                <p className="text-sm font-medium text-slate-200 truncate" title={item.query}>
                  {item.query}
                </p>
                {item.fileInfo && (
                  <p className="text-xs text-slate-400 mt-0.5 italic truncate" title={`File: ${item.fileInfo.name}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1 inline">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.687 7.687a1.5 1.5 0 0 0 2.122 2.122l7.687-7.687-2.122-2.122Z" />
                    </svg>
                    {item.fileInfo.name}
                  </p>
                )}
                {item.responseTextPreview && (
                   <p className="text-xs text-slate-400 mt-0.5 italic truncate" title={`Response: ${item.responseTextPreview}`}>
                    Response: {item.responseTextPreview}
                  </p>
                )}
              </div>
              <button
                onClick={() => onItemClick(item)}
                className="ml-3 mt-1 px-3 py-1.5 text-xs font-medium text-pink-400 bg-slate-700 hover:bg-pink-600 hover:text-pink-100 rounded-md transition-colors duration-200 flex-shrink-0"
                aria-label={`Use query: ${item.query}`}
              >
                Use Query
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
