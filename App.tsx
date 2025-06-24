
import React, { useState, useCallback, useEffect, ReactNode } from 'react';
import { QueryInput } from './components/QueryInput';
import { ResponseDisplay } from './components/ResponseDisplay';
import { GroundingSources } from './components/GroundingSources';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { ImageDisplay } from './components/ImageDisplay';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { HistoryPanel } from './components/HistoryPanel'; // New Import
import type { WebSource, GroundingChunkWeb, HistoryItem } from './types'; // Updated Import
import { streamQueryWithGoogleSearch, generateImageFromPrompt } from './services/geminiService';
import type { Part } from '@google/genai';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable not set. Please ensure it is configured.");
}

type Mode = 'text' | 'image';
const MAX_HISTORY_ITEMS = 30;
const LOCAL_STORAGE_HISTORY_KEY = 'geminiAppSearchHistory';

const fileToGenerativePart = async (file: File): Promise<Part | null> => {
  const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
  if (!supportedTypes.includes(file.type)) {
    console.warn(`Unsupported file type: ${file.type}. Skipping file.`);
    return null;
  }
  const base64String = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.substring(result.indexOf(',') + 1));
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
  return { inlineData: { mimeType: file.type, data: base64String } };
};

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<Mode>('text');
  const [query, setQuery] = useState<string>('');
  const [responseText, setResponseText] = useState<string>('');
  const [groundingSources, setGroundingSources] = useState<WebSource[]>([]);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  
  // Search History State
  const [searchHistory, setSearchHistory] = useState<HistoryItem[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setSearchHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage:", e);
      setSearchHistory([]); // Initialize with empty if error
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(searchHistory));
    } catch (e) {
      console.error("Failed to save history to localStorage:", e);
    }
  }, [searchHistory]);

  const addToHistory = (itemDetails: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    setSearchHistory(prevHistory => {
      const newHistoryItem: HistoryItem = {
        ...itemDetails,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      };
      const updatedHistory = [newHistoryItem, ...prevHistory];
      return updatedHistory.slice(0, MAX_HISTORY_ITEMS); // Keep only the latest MAX_HISTORY_ITEMS
    });
  };

  const handleHistoryItemClick = (item: HistoryItem) => {
    setCurrentMode(item.mode);
    setQuery(item.query);
    setSelectedFile(null); // Clear selected file, user needs to re-attach if needed
    setResponseText('');
    setGroundingSources([]);
    setGeneratedImageUrl(null);
    setError(null);
    setIsLoading(false);
    setShowHistoryPanel(false); // Close panel after selection
    // Optional: Could add a small, non-error message if item.fileInfo exists
    if (item.fileInfo) {
        // This could be a gentle notification, not an error.
        // For simplicity, we just clear the file and user has to re-select.
        console.log(`History item "${item.query}" originally had a file: ${item.fileInfo.name}. Please re-attach if needed.`);
    }
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
  };

  const switchMode = (newMode: Mode) => {
    setCurrentMode(newMode);
    setQuery('');
    setResponseText('');
    setGroundingSources([]);
    setGeneratedImageUrl(null);
    setSelectedFile(null);
    setError(null);
    setIsLoading(false);
    setShowCameraModal(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!acceptedImageTypes.includes(file.type)) {
        setError(`Unsupported file type: ${file.name}. Please select a JPEG, PNG, WEBP, HEIC or HEIF image.`);
        setSelectedFile(null);
        event.target.value = ''; 
        return;
      }
      setError(null); 
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = '';
    }
  };

  const handleImageCaptured = (imageFile: File) => {
    setError(null);
    setSelectedFile(imageFile);
    setShowCameraModal(false);
  };

  const handleSubmit = useCallback(async () => {
    if (!query.trim() && currentMode === 'text' && !selectedFile) {
      setError(`Please enter a query or attach an image.`);
      return;
    }
    if (!query.trim() && currentMode === 'image') {
       setError(`Please enter a prompt for image generation.`);
       return;
    }
    if (!API_KEY) {
      setError("API Key is not configured. Cannot process the request.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponseText('');
    setGroundingSources([]);
    setGeneratedImageUrl(null);
    
    let finalResponseTextForHistory = ""; // To capture full text response for history preview

    try {
      if (currentMode === 'text') {
        let imagePart: Part | null = null;
        if (selectedFile) {
          imagePart = await fileToGenerativePart(selectedFile);
          if (!imagePart) { 
             setError(`The attached file '${selectedFile.name}' is not a supported image type or could not be processed.`);
             setIsLoading(false);
             return;
          }
        }

        const stream = streamQueryWithGoogleSearch(query, API_KEY, imagePart);
        let accumulatedText = '';
        const sourcesMap = new Map<string, WebSource>();

        for await (const chunk of stream) {
          const chunkText = chunk.text;
          if (chunkText) {
            accumulatedText += chunkText;
            setResponseText(prev => prev + chunkText);
          }
          finalResponseTextForHistory = accumulatedText; // Keep updating for final history entry

          const webChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(
            (gc): gc is GroundingChunkWeb => gc.web !== undefined && gc.web !== null
          );

          if (webChunks) {
            webChunks.forEach(gc => {
              if (gc.web && gc.web.uri && !sourcesMap.has(gc.web.uri)) {
                sourcesMap.set(gc.web.uri, { uri: gc.web.uri, title: gc.web.title || gc.web.uri });
              }
            });
            setGroundingSources(Array.from(sourcesMap.values()));
          }
        }
        // Add to history after successful text generation
        addToHistory({
            mode: 'text',
            query: query,
            fileInfo: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : undefined,
            responseTextPreview: finalResponseTextForHistory.substring(0, 100) + (finalResponseTextForHistory.length > 100 ? '...' : '')
        });

      } else if (currentMode === 'image') {
        if (!query.trim()) {
            setError("Image generation requires a text prompt.");
            setIsLoading(false);
            return;
        }
        const imageUrl = await generateImageFromPrompt(query, API_KEY);
        setGeneratedImageUrl(imageUrl);
        // Add to history after successful image generation
        addToHistory({
            mode: 'image',
            query: query, // Store the prompt
        });
      }
    } catch (e: any) {
      console.error("Error during API call:", e);
      setError(`Failed to get response: ${e.message || 'Unknown error'}`);
      if (currentMode === 'text') setResponseText('');
      if (currentMode === 'image') setGeneratedImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [query, currentMode, selectedFile]);

  const submitButtonText = currentMode === 'text' ? 'Send Query' : 'Generate Image';
  const submitButtonIcon = currentMode === 'text' ? (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
  const placeholderText = currentMode === 'text' 
    ? "Enter your query, attach an image, or use camera... (Press Enter to submit, Shift+Enter for new line)" 
    : "Describe the image you want to generate...";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-gray-100 flex flex-col items-center p-4 sm:p-6 md:p-8 font-inter">
      <div className="w-full max-w-3xl space-y-8">
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Gemini AI Multimodal App
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Powered by Alvin Saji
          </p>
          <p className="mt-2 text-lg text-slate-400">
            {currentMode === 'text' ? 'Get streamed text responses with Google Search grounding and image support.' : 'Generate images from your descriptions.'}
          </p>
        </header>

        <div className="mb-6 flex justify-center space-x-1 sm:space-x-2 border-b border-slate-700">
          <button 
            onClick={() => switchMode('text')} 
            className={`px-3 py-2 sm:px-4 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-200 ${currentMode === 'text' ? 'bg-slate-700 text-pink-400 border-b-2 border-pink-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            aria-pressed={currentMode === 'text'}
          >
            Text Search
          </button>
          <button 
            onClick={() => switchMode('image')} 
            className={`px-3 py-2 sm:px-4 text-sm sm:text-base font-medium rounded-t-lg transition-colors duration-200 ${currentMode === 'image' ? 'bg-slate-700 text-pink-400 border-b-2 border-pink-400' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
            aria-pressed={currentMode === 'image'}
          >
            Image Generation
          </button>
        </div>

        <QueryInput
          query={query}
          setQuery={setQuery}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitButtonText={submitButtonText}
          submitButtonIcon={submitButtonIcon}
          placeholder={placeholderText}
          mode={currentMode}
          onFileChange={handleFileChange}
          selectedFile={selectedFile}
          onRemoveFile={handleRemoveFile}
          onOpenCamera={() => setShowCameraModal(true)}
        />

        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}

        {!isLoading && currentMode === 'text' && (responseText || (selectedFile && query)) && (
          <ResponseDisplay responseText={responseText || (selectedFile && !responseText ? `Processing image '${selectedFile.name}' ${query ? `with query "${query}"` : "..."}` : "")} />
        )}
        
        {!isLoading && currentMode === 'text' && groundingSources.length > 0 && (
          <GroundingSources sources={groundingSources} />
        )}

        {!isLoading && currentMode === 'image' && generatedImageUrl && (
          <ImageDisplay imageUrl={generatedImageUrl} altText={query} />
        )}
        
        {showCameraModal && (
          <CameraCaptureModal
            isOpen={showCameraModal}
            onClose={() => setShowCameraModal(false)}
            onImageCaptured={handleImageCaptured}
            onError={(camError) => {
              setError(`Camera Error: ${camError}`);
              setShowCameraModal(false);
            }}
          />
        )}
        
        <div className="mt-8">
            <button
                onClick={() => setShowHistoryPanel(prev => !prev)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium rounded-lg shadow-sm transition-colors duration-200 flex items-center justify-center"
                aria-expanded={showHistoryPanel}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                {showHistoryPanel ? 'Hide' : 'Show'} Search History
            </button>
            {showHistoryPanel && (
                <HistoryPanel
                    history={searchHistory}
                    onItemClick={handleHistoryItemClick}
                    onClearHistory={handleClearHistory}
                />
            )}
        </div>

      </div>
      <footer className="w-full max-w-3xl mt-12 text-center text-slate-500 text-sm">
        <p>Powered by Google Gemini API. API Key usage is subject to Google's terms.</p>
        <p>Image upload supports PNG, JPEG, WEBP, HEIC, HEIF formats.</p>
      </footer>
    </div>
  );
};

export default App;
