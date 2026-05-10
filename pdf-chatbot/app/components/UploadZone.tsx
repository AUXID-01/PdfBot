"use client";

import React, { useState, useRef } from "react";

interface UploadZoneProps {
  onUploadComplete: (filename: string, chunkCount: number) => void;
}

export default function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [indexedMsg, setIndexedMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file.type !== "application/pdf") {
      setStatus("error");
      setErrorMsg("Please upload a PDF file.");
      return;
    }
    
    setStatus("uploading");
    setProgress(0);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        setProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        setStatus("success");
        setIndexedMsg(`✓ Indexed ${res.chunkCount} chunks from ${res.filename}`);
        onUploadComplete(res.filename, res.chunkCount);
      } else {
        setStatus("error");
        try {
          const res = JSON.parse(xhr.responseText);
          setErrorMsg(res.error || "Upload failed.");
        } catch {
          setErrorMsg("An unexpected error occurred.");
        }
      }
    };

    xhr.onerror = () => {
      setStatus("error");
      setErrorMsg("Network error occurred.");
    };

    const formData = new FormData();
    formData.append("pdf", file);
    xhr.send(formData);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const clearDoc = async () => {
    setStatus("idle");
    setIndexedMsg("");
    setErrorMsg("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    
    await fetch("/api/clear", { method: "DELETE" });
    onUploadComplete("", 0); // Clear in parent
  };

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium shadow-sm">
          {indexedMsg}
        </div>
        <button 
          onClick={clearDoc}
          className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Upload a new doc
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ease-out cursor-pointer ${
          isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.02]" : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/50"
        } ${status === "uploading" ? "pointer-events-none opacity-80" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          accept="application/pdf" 
          className="hidden" 
          ref={fileInputRef}
          onChange={(e) => e.target.files && e.target.files[0] && handleFile(e.target.files[0])}
        />
        
        <div className="flex flex-col items-center gap-3">
          <div className={`p-3.5 rounded-2xl ${isDragging ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"} transition-colors shadow-sm`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {isDragging ? "Drop PDF here" : "Click or drag to upload"}
            </p>
            <p className="text-xs text-slate-400 mt-1">PDF files up to 20MB</p>
          </div>
        </div>

        {status === "uploading" && (
          <div className="absolute bottom-0 left-0 h-1.5 bg-blue-500 transition-all duration-200" style={{ width: `${progress}%` }} />
        )}
      </div>

      {status === "error" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1 flex items-start gap-2 shadow-sm">
           <svg className="shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span className="leading-tight">{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
