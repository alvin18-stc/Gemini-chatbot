
import React, { ReactNode } from 'react';

interface QueryInputProps {
  query: string;
  setQuery: (query: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitButtonText: string;
  submitButtonIcon: ReactNode;
  placeholder: string;
  mode: 'text' | 'image';
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
  onRemoveFile: () => void;
  onOpenCamera: () => void; // New prop for camera
}

export const QueryInput: React.FC<QueryInputProps> = ({ 
  query, 
  setQuery, 
  onSubmit, 
  isLoading, 
  submitButtonText, 
  submitButtonIcon,
  placeholder,
  mode,
  onFileChange,
  selectedFile,
  onRemoveFile,
  onOpenCamera // New prop
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading) {
        onSubmit();
      }
    }
  };

  const canSubmit = (): boolean => {
    if (isLoading) return false;
    if (mode === 'text') {
      return query.trim() !== '' || selectedFile !== null;
    }
    // For image mode, query (prompt) is required
    return query.trim() !== '';
  };


  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-2xl space-y-4">
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-4 text-slate-100 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-200 resize-none custom-scrollbar"
        rows={mode === 'text' ? 4 : 3}
        disabled={isLoading}
        aria-label={mode === 'text' ? "Query input" : "Image description input"}
      />

      {mode === 'text' && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <label
              htmlFor="file-input"
              className={`flex-1 flex items-center justify-center px-4 py-2 border border-slate-600 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-pink-400 transition-colors duration-200 cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-disabled={isLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.687 7.687a1.5 1.5 0 0 0 2.122 2.122l7.687-7.687-2.122-2.122Z" />
              </svg>
              {selectedFile ? 'Change Image' : 'Attach Image'}
            </label>
            <input
              type="file"
              id="file-input"
              onChange={onFileChange}
              disabled={isLoading}
              className="hidden"
              accept="image/png, image/jpeg, image/webp, image/heic, image/heif"
              aria-label="File attachment input"
            />
             <button
              type="button"
              onClick={onOpenCamera}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center px-4 py-2 border border-slate-600 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-teal-400 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Use camera to capture image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.174C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.174 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              Use Camera
            </button>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-2 bg-slate-700 rounded-md text-sm text-slate-300">
              <span className="truncate" title={selectedFile.name}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 inline">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                {selectedFile.name}
              </span>
              <button
                onClick={onRemoveFile}
                disabled={isLoading}
                className="ml-2 text-slate-400 hover:text-red-400 disabled:opacity-50"
                aria-label="Remove attached file"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!canSubmit()}
        className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={submitButtonText}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : (
          <>
            {submitButtonIcon}
            {submitButtonText}
          </>
        )}
      </button>
    </div>
  );
};
