import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "chromadb", "@huggingface/transformers", "onnxruntime-node"],
};

export default nextConfig;
