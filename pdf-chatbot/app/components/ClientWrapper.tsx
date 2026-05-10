"use client";

import React, { useState } from "react";
import UploadZone from "./UploadZone";
import ChatWindow from "./ChatWindow";

export default function ClientWrapper() {
  const [filename, setFilename] = useState<string | null>(null);
  const [chunkCount, setChunkCount] = useState<number>(0);

  const handleUploadComplete = (name: string, chunks: number) => {
    // If name is empty, it means we are clearing
    setFilename(name || null);
    setChunkCount(chunks);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar - w-64 */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shadow-[2px_0_10px_-3px_rgba(0,0,0,0.03)] z-10 relative">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">DocMind</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium ml-8">RAG-Powered Chatbot</p>
        </div>

        <div className="p-6 flex-1 flex flex-col gap-6">
          <UploadZone onUploadComplete={handleUploadComplete} />
          
          {filename && (
            <div className="mt-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl transition-all">
              <h3 className="text-[10px] font-bold tracking-wider text-blue-800/80 uppercase mb-3">Active Document</h3>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 p-1.5 bg-blue-100 text-blue-600 rounded-md shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 truncate" title={filename}>{filename}</p>
                  <p className="text-xs text-slate-500 mt-1 inline-flex items-center px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700">
                    {chunkCount} chunks
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 text-[10px] text-center text-slate-400">
          DocMind AI Platform &copy; 2026
        </div>
      </aside>

      {/* Main Chat Window */}
      <ChatWindow filename={filename} />
    </div>
  );
}
