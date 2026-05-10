import { NextRequest, NextResponse } from "next/server";
import { ChromaClient } from "chromadb";

export async function DELETE(request: NextRequest) {
  try {
    const client = new ChromaClient();

    // Delete the collection
    await client.deleteCollection({ name: "pdf_docs" }).catch(() => {
      // Ignore if it doesn't exist yet
    });
    
    // Recreate it empty
    await client.createCollection({ name: "pdf_docs" });

    return NextResponse.json({ message: "Collection cleared" });
  } catch (error: any) {
    console.error("Clear error:", error);
    return NextResponse.json({ error: "Failed to clear collection" }, { status: 500 });
  }
}
