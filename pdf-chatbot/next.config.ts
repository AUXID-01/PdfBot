import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: [
    "pdf-parse", 
    "chromadb", 
    "@chroma-core/default-embed", 
    "@huggingface/transformers", 
    "onnxruntime-node",
    "sharp"
  ],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "sharp$": false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};


export default nextConfig;
