import { NextRequest } from "next/server";
import { answerQuestion } from "@/lib/query";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question } = body;

    if (!question) {
      return new Response(JSON.stringify({ error: "No question provided" }), { status: 400 });
    }

    const { answerStream, sources } = await answerQuestion(question);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of answerStream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
              const data = JSON.stringify({ token });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
          }
          // Final chunk with done: true and sources
          const finalData = JSON.stringify({ done: true, sources });
          controller.enqueue(new TextEncoder().encode(`data: ${finalData}\n\n`));
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
