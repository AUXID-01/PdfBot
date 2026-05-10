import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf";
import { getCollection } from "./chroma";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function answerQuestion(question: string) {
  // 1. Embed the question using Local Transformers
  const embeddings = new HuggingFaceTransformersEmbeddings({
    model: "sentence-transformers/all-MiniLM-L6-v2",
  });
  const queryEmbedding = await embeddings.embedQuery(question);

  // 2. Query ChromaDB collection "pdf_docs", nResults: 5
  const collection = await getCollection("pdf_docs");
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: 5,
  });

  const retrievedDocs = results.documents[0] || [];
  const retrievedMetadata = results.metadatas[0] || [];

  // 3. Build context string
  let context = "";
  const sources: Array<{ page: number; snippet: string }> = [];

  for (let i = 0; i < retrievedDocs.length; i++) {
    const text = retrievedDocs[i] as string;
    const metadata = retrievedMetadata[i] as { source: string; page: number; chunkIndex: number };
    
    if (text && metadata) {
      context += `[Page ${metadata.page} — ${metadata.source}]\n ${text} \n\n`;
      sources.push({
        page: metadata.page,
        snippet: text.substring(0, 100) + "...",
      });
    }
  }

  // 4. Call Groq API with this system prompt
  const systemPrompt = `You are a document assistant. Answer using ONLY the context below.
If the answer is not present, reply exactly:
'I could not find this information in the uploaded document.'

Context:
${context}`;

  const answerStream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ],
    temperature: 0,
    stream: true,
  });

  // 5. Return the stream and sources
  // Note: I am returning the stream object instead of a resolved string
  // to allow the API route to perform actual real-time streaming.
  return { answerStream, sources };
}
