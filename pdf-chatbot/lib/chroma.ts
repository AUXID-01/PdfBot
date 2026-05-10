import { ChromaClient } from "chromadb";

// Export a singleton getCollection(name) function
// Note: The Node.js 'chromadb' package acts as a REST client. 
// It does not have a built-in local SQLite/DuckDB persistence engine like the Python PersistentClient.
// By pointing to CHROMA_PATH here, it will expect a running Chroma server at that URL.
const chromaUrl = new URL(process.env.CHROMA_PATH || "http://127.0.0.1:8000");

const client = new ChromaClient({
  host: chromaUrl.hostname,
  port: parseInt(chromaUrl.port || (chromaUrl.protocol === "https:" ? "443" : "80")),
  ssl: chromaUrl.protocol === "https:",
});

export async function getCollection(name: string) {
  // If collection exists, return it; if not, create it
  // We pass an empty embedding function because we compute embeddings ourselves in ingest.ts and query.ts
  return await client.getOrCreateCollection({
    name,
    embeddingFunction: {
      generate: async () => []
    }
  });
}
