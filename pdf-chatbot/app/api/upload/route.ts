import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { ingestPDF } from "@/lib/ingest";

export async function POST(request: NextRequest) {
  try {
    // 1. Parse FormData
    const formData = await request.formData();
    const file = formData.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    console.log(`Starting upload process for file: ${file.name}, size: ${file.size}`);

    if (file.size > 20 * 1024 * 1024) {
      console.warn("File size exceeds 20MB limit.");
      return NextResponse.json({ error: "File exceeds 20MB limit." }, { status: 400 });
    }

    // Prepare temp directory
    const tmpDir = process.platform === "win32" ? path.join(os.tmpdir(), "pdf-chatbot-tmp") : "/tmp";
    console.log(`Using temporary directory: ${tmpDir}`);
    
    if (process.platform === "win32") {
      await mkdir(tmpDir, { recursive: true });
    }

    // 2. Write file to temp location
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const tempFilePath = path.join(tmpDir, `${timestamp}-${safeName}`);

    console.log(`Saving file to temp path: ${tempFilePath}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempFilePath, buffer);

    try {
      // 3. Call ingestPDF()
      console.log("Starting PDF ingestion...");
      const { chunkCount } = await ingestPDF(tempFilePath, file.name);
      console.log(`Ingestion complete. Generated ${chunkCount} chunks.`);

      // 4. Delete the temp file after ingestion
      await unlink(tempFilePath);
      console.log("Temporary file deleted.");

      // 5. Return NextResponse.json
      return NextResponse.json(
        { message: "File ingested successfully", chunkCount, filename: file.name },
        { status: 200 }
      );
    } catch (ingestionError: any) {
      // Cleanup on error
      await unlink(tempFilePath).catch(() => {});
      console.error("Ingestion failed with error:", ingestionError);
      return NextResponse.json(
        { error: "Failed to process and ingest PDF.", details: ingestionError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Critical upload error:", error);
    return NextResponse.json(
      { error: "Internal server error during upload.", details: error.message },
      { status: 500 }
    );
  }
}

