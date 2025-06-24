
import React from 'react';
import type { WebSource } from '../types';

interface GroundingSourcesProps {
  sources: WebSource[];
}

export const GroundingSources: React.FC<GroundingSourcesProps> = ({ sources }) => {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
      <h3 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Grounding Sources:</h3>
      <ul className="space-y-3">
        {sources.map((source, index) => (
          <li key={source.uri + index} className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 hover:border-teal-500 transition-colors duration-200">
            <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="group text-slate-300 hover:text-teal-400 transition-colors duration-200"
            >
              <p className="font-medium truncate group-hover:underline">{source.title || 'Untitled Source'}</p>
              <p className="text-xs text-slate-400 truncate group-hover:text-teal-500">{source.uri}</p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};