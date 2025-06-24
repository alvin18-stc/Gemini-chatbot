
import React from 'react';

interface ResponseDisplayProps {
  responseText: string;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ responseText }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">AI Response:</h2>
      <div 
        className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-300 whitespace-pre-wrap overflow-x-auto custom-scrollbar bg-slate-700/50 p-4 rounded-lg border border-slate-600 min-h-[100px]"
        style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }} // Ensure text wraps
      >
        {responseText || "Waiting for response..."}
      </div>
    </div>
  );
};