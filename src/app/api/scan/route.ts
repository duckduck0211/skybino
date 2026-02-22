import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.THAURA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "THAURA_API_KEY nicht konfiguriert. Bitte in .env.local eintragen." },
      { status: 500 }
    );
  }

  const body = await req.json() as {
    imageBase64: string;
    mimeType: string;
    followUp?: string;
  };

  if (!body.imageBase64) {
    return NextResponse.json({ error: "Kein Bild übermittelt." }, { status: 400 });
  }

  const dataUrl = `data:${body.mimeType ?? "image/jpeg"};base64,${body.imageBase64}`;

  // Feynman system prompt
  const systemPrompt = `Du bist ein deutscher Lernassistent für die App Synapze.
Du erklärst Inhalte nach der Feynman-Methode: einfach, präzise, ohne unnötige Fachbegriffe,
aber mit klaren Schritt-für-Schritt-Erklärungen.

Wenn du ein mathematisches Problem siehst:
1. Beschreibe kurz, um was es sich handelt
2. Erkläre den Lösungsweg Schritt für Schritt
3. Gib das finale Ergebnis an
4. Erkläre das zugrundeliegende Konzept so, als würdest du es einem 12-Jährigen erklären

Formatiere deine Antwort mit klaren Abschnitten. Antwworte immer auf Deutsch.`;

  const userContent = body.followUp
    ? [
        {
          type: "text" as const,
          text: `Ich habe eine Folgefrage zum Bild: ${body.followUp}`,
        },
        {
          type: "image_url" as const,
          image_url: { url: dataUrl },
        },
      ]
    : [
        {
          type: "text" as const,
          text: "Bitte analysiere dieses Bild und erkläre den Inhalt nach der Feynman-Methode auf Deutsch. Wenn es sich um ein Mathematik-Problem handelt, löse es Schritt für Schritt.",
        },
        {
          type: "image_url" as const,
          image_url: { url: dataUrl },
        },
      ];

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
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!thauraRes.ok) {
    const text = await thauraRes.text();
    console.error("Thaura scan API error:", thauraRes.status, text);
    return NextResponse.json(
      { error: `Thaura API Fehler (${thauraRes.status})` },
      { status: 502 }
    );
  }

  // Proxy SSE stream back to client
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
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
