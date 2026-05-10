"use client";

import React, { useState, useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { page: number }[];
  streaming?: boolean;
}

interface ChatWindowProps {
  filename: string | null;
}

export default function ChatWindow({ filename }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Reset messages when a new file is uploaded
  useEffect(() => {
    setMessages([]);
  }, [filename]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    const botMsgId = (Date.now() + 1).toString();
    const initialBotMsg: Message = { id: botMsgId, role: "assistant", content: "", streaming: true };
    
    setMessages(prev => [...prev, userMsg, initialBotMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg.content }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "");
              if (!dataStr.trim()) continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.token) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId ? { ...msg, content: msg.content + data.token } : msg
                  ));
                }
                if (data.done) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === botMsgId ? { ...msg, streaming: false, sources: data.sources } : msg
                  ));
                  setIsStreaming(false);
                }
              } catch (e) {
                console.error("Error parsing SSE data", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Chat error", error);
      setIsStreaming(false);
      setMessages(prev => prev.map(msg => 
        msg.id === botMsgId ? { ...msg, content: "Error: Could not fetch response.", streaming: false } : msg
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!filename) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40"></div>
        <div className="w-16 h-16 bg-white border border-slate-200 text-blue-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3 transition-transform hover:rotate-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload a PDF first</h2>
        <p className="text-slate-500 max-w-sm">Please upload a document from the sidebar to start asking questions.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 relative shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.02)] z-20">
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">You're all set!</h3>
            <p className="text-slate-500 max-w-sm">Ask any question about the uploaded document and I'll find the answer.</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full pb-4">
            {messages.map(msg => (
              <MessageBubble key={msg.id} {...msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] z-10">
        <div className="max-w-4xl mx-auto relative flex items-end gap-3 p-1.5 rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about the document..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-2.5 px-4 text-sm text-slate-800 placeholder:text-slate-400"
            rows={1}
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="mb-0.5 mr-0.5 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">Answers are generated based solely on the uploaded document context.</p>
      </div>
    </div>
  );
}
