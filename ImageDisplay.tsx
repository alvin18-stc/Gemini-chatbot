
import React from 'react';

interface ImageDisplayProps {
  imageUrl: string;
  altText?: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ imageUrl, altText = "Generated image" }) => {
  return (
    <div className="bg-slate-800 p-4 sm:p-6 rounded-xl shadow-2xl flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-400">
        Generated Image:
      </h2>
      <div className="max-w-full w-auto max-h-[70vh] rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg">
        <img 
          src={imageUrl} 
          alt={altText} 
          className="object-contain w-full h-full"
        />
      </div>
      {altText && <p className="mt-3 text-sm text-slate-400 italic">Prompt: "{altText}"</p>}
    </div>
  );
};
