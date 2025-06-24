
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-6 bg-slate-800 rounded-xl shadow-2xl">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-sky-500 h-6 w-6"></div>
        <div className="rounded-full bg-pink-500 h-6 w-6"></div>
        <div className="rounded-full bg-purple-500 h-6 w-6"></div>
      </div>
      <p className="ml-4 text-slate-300 text-lg">Loading response...</p>
    </div>
  );
};