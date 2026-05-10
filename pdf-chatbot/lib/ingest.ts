import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import pdf from "pdf-parse";
import fs from "fs/promises";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { getCollection } from "./chroma";

export async function ingestPDF(filePath: string, filename: string): Promise<{ chunkCount: number }> {
  // 1. Load the PDF buffer and parse it
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  
  // Create a LangChain document from the parsed text
  const rawDocs = [new Document({ pageContent: data.text, metadata: { source: filename } })];

  // 2. Chunk with RecursiveCharacterTextSplitter
  // Why these values? 
  // chunkSize: 500 characters strikes a good balance between providing enough context 
  // for the LLM to understand semantic meaning, and keeping it focused enough to pinpoint facts.
  // chunkOverlap: 50 ensures that concepts split across chunk boundaries aren't lost, 
  // maintaining continuity between adjacent chunks.
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
  });
  
  const docs = await textSplitter.splitDocuments(rawDocs);

  // 3. Embed with HuggingFace Inference API (Keeps deployment size small!)
  const embeddings = new HuggingFaceInferenceEmbeddings({
    apiKey: process.env.HUGGINGFACE_API_KEY,
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });

  const texts = docs.map((doc) => doc.pageContent);
  const embeddingsArray = await embeddings.embedDocuments(texts);

  // 4. Upsert into ChromaDB with metadata
  console.log("Connecting to ChromaDB...");
  const collection = await getCollection("pdf_docs");
  console.log("Collection obtained. Preparing data for upsert...");

  const metadatas = docs.map((doc, i) => ({
    source: filename,
    page: doc.metadata.loc?.pageNumber || doc.metadata.page || 1,
    chunkIndex: i,
  }));

  const ids = docs.map((_, i) => `${filename}-chunk-${i}`);

  console.log(`Upserting ${ids.length} chunks into ChromaDB...`);
  try {
    await collection.upsert({
      ids,
      embeddings: embeddingsArray,
      metadatas,
      documents: texts,
    });
    console.log("ChromaDB upsert successful.");
  } catch (dbError: any) {
    console.error("ChromaDB upsert failed:", dbError);
    throw new Error(`Database error: ${dbError.message}`);
  }


  // 5. Return chunkCount
  return { chunkCount: docs.length };
}
