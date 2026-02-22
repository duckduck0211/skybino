import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.THAURA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "THAURA_API_KEY nicht konfiguriert." },
      { status: 500 }
    );
  }

  const { explanation } = await req.json() as { explanation: string };
  if (!explanation?.trim()) {
    return NextResponse.json({ error: "Keine Erklärung übermittelt." }, { status: 400 });
  }

  const thauraRes = await fetch("https://backend.thaura.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "thaura",
      stream: false,
      messages: [
        {
          role: "system",
          content:
            "Du bist ein Lernkarten-Generator für die App Synapze. " +
            "Erstelle aus dem gegebenen Lerninhalt 3-6 Flashcards im JSON-Format. " +
            "Jede Karte hat 'front' (Frage) und 'back' (Antwort). Antworten kurz und präzise. " +
            "Antworte NUR mit einem JSON-Array, kein Text drum herum: [{\"front\": \"...\", \"back\": \"...\"}]",
        },
        {
          role: "user",
          content: `Erstelle Lernkarten aus diesem Inhalt:\n\n${explanation}`,
        },
      ],
    }),
  });

  if (!thauraRes.ok) {
    const text = await thauraRes.text();
    console.error("scan-to-cards error:", thauraRes.status, text);
    return NextResponse.json({ error: "Thaura API Fehler" }, { status: 502 });
  }

  const data = await thauraRes.json() as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content ?? "[]";

  // Parse JSON from the response, strip possible markdown fences
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  try {
    const cards = JSON.parse(cleaned) as { front: string; back: string }[];
    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ error: "Konnte Karten nicht parsen.", raw }, { status: 500 });
  }
}
