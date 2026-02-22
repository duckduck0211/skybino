import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { front, back } = await req.json();

  if (!front) {
    return NextResponse.json({ error: "Missing front" }, { status: 400 });
  }

  const apiKey = process.env.THAURA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "THAURA_API_KEY not configured" }, { status: 500 });
  }

  const thauraRes = await fetch("https://backend.thaura.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "thaura",
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "Du bist ein KI-Lernassistent für Synapze, eine Spaced-Repetition-Lernkarten-App. " +
            "Erkläre Lernkarteninhalte auf Deutsch. Sei präzise und hilfreich. " +
            "Antworte in 2-3 kurzen Sätzen. Kein Markdown, kein Fettdruck.",
        },
        {
          role: "user",
          content:
            `Lernkarte:\nBegriff: ${front}\nAntwort: ${back}\n\n` +
            "Erkläre diesen Begriff kurz und verständlich. Was macht ihn wichtig und wie merkt man ihn sich gut?",
        },
      ],
    }),
  });

  if (!thauraRes.ok) {
    const text = await thauraRes.text();
    console.error("Thaura API error:", thauraRes.status, text);
    return NextResponse.json({ error: "Thaura API error" }, { status: 502 });
  }

  // Proxy the SSE stream directly back to the client
  const stream = new ReadableStream({
    async start(controller) {
      const reader = thauraRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      // client disconnected — nothing to clean up, reader closes with GC
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
