import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdf-parse", 
    "chromadb", 
    "@chroma-core/default-embed", 
    "@huggingface/transformers", 
    "onnxruntime-node"
  ],
};


export default nextConfig;
