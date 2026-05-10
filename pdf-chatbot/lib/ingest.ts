import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf";
import { getCollection } from "./chroma";

export async function ingestPDF(filePath: string, filename: string): Promise<{ chunkCount: number }> {
  // 1. Load with PDFLoader — preserves page metadata
  const loader = new PDFLoader(filePath);
  const rawDocs = await loader.load();

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

  // 3. Embed with Local Transformers (No API Key needed!)
  const embeddings = new HuggingFaceTransformersEmbeddings({
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
