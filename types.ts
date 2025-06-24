// types.ts
import type { Part } from '@google/genai';

export interface WebSource {
  uri: string;
  title: string;
}

// Simplified GroundingChunk focusing on web content for clarity
export interface GroundingChunkWeb {
  web: {
    uri:string;
    title?: string; // Title might be optional
  };
  retrievedContext?: never; // To distinguish from other potential grounding contexts
}

export interface GroundingChunkRetrievedContext {
  retrievedContext: {
    uri: string;
    title?: string;
  };
  web?: never;
}

export type GroundingChunk = GroundingChunkWeb | GroundingChunkRetrievedContext;


// For constructing request content parts
export interface UserContent {
  role: "user";
  parts: Part[];
}

export interface ModelContent {
  role: "model";
  parts: Part[];
}

export type ChatContent = UserContent | ModelContent;

// New interface for Search History
export interface HistoryItem {
  id: string;
  mode: 'text' | 'image';
  query: string; // Query for text, Prompt for image
  timestamp: number;
  fileInfo?: { // Only for text mode
    name: string;
    type: string;
  };
  responseTextPreview?: string; // Short preview of text response (text mode)
}
