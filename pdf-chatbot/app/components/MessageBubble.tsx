"use client";

import React from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: { page: number }[];
  streaming?: boolean;
}

export default function MessageBubble({ role, content, sources, streaming }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-6 animate-in slide-in-from-bottom-2 duration-500`}>
      <div className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
        <div 
          className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
            isUser 
              ? "bg-blue-600 text-white rounded-br-sm" 
              : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
          }`}
        >
          {content || (streaming ? "" : "...")}
          {streaming && (
            <span className="inline-flex gap-1 ml-2 translate-y-[1px]">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
            </span>
          )}
        </div>
        
        {sources && sources.length > 0 && (
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 px-2 py-1 font-medium bg-slate-100 rounded-md border border-slate-200 mt-1 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            Sources: {sources.map(s => `p.${s.page}`).join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}
