# 🤖 InsightAI - RAG Powered PDF Chatbot

InsightAI is a high-performance, production-ready PDF chatbot built with **Next.js 15**, **Groq**, and **ChromaDB**. It uses Retrieval-Augmented Generation (RAG) to provide accurate answers based on your uploaded documents.

## ✨ Features
- **PDF Ingestion**: Upload documents up to 20MB.
- **RAG Architecture**: Intelligent chunking and semantic search for context-aware answers.
- **Lightning Fast**: Powered by Groq's LPU for near-instant AI responses.
- **Local Embeddings**: Uses HuggingFace Transformers running locally on the server.
- **Glassmorphic UI**: A modern, premium dark-mode interface.

## 🛠️ Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **LLM**: [Groq](https://groq.com) (Llama-3)
- **Vector Database**: [ChromaDB](https://www.trychroma.com/)
- **Embeddings**: HuggingFace (all-MiniLM-L6-v2)
- **Styling**: Tailwind CSS + Glassmorphism

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- A running ChromaDB instance (local or hosted)
- A Groq API Key

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
GROQ_API_KEY=your_groq_key_here
CHROMA_PATH=http://127.0.0.1:8000
```

### 3. Installation
```bash
npm install
```

### 4. Run Locally
```bash
npm run dev
```

## 🌐 Deployment (Vercel)
1. **Host ChromaDB**: Deploy ChromaDB on a VPS (Render, Railway, etc.) as Vercel doesn't support local persistent storage.
2. **Environment Variables**: Add `GROQ_API_KEY` and your hosted `CHROMA_PATH` in Vercel settings.
3. **Deploy**: Import the repo to Vercel and click deploy.

---
Built with ❤️ by [AUXID-01](https://github.com/AUXID-01)

