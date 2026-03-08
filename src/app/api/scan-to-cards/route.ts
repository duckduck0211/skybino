import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.THAURA_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "THAURA_API_KEY nicht konfiguriert." },
      { status: 500 }
    );
  }

  const body = await req.json() as {
    explanation?: string;
    imageBase64?: string;
    mimeType?: string;
    count?: number;
  };

  const count = body.count ?? 8;
  const hasImage = !!body.imageBase64;
  const hasText  = !!body.explanation?.trim();

  if (!hasImage && !hasText) {
    return NextResponse.json({ error: "Kein Inhalt übermittelt." }, { status: 400 });
  }

  const systemPrompt =
    "Du bist ein Lernkarten-Generator. " +
    `Erstelle ${count} Flashcards aus dem gegebenen Inhalt. ` +
    "Jede Karte hat 'front' (kurze Frage oder Begriff) und 'back' (präzise Antwort). " +
    "Antworte NUR mit einem JSON-Array, kein Text drum herum: " +
    '[{"front": "...", "back": "..."}, ...]';

  type MsgContent =
    | string
    | { type: string; text?: string; image_url?: { url: string } }[];

  let userContent: MsgContent;
  if (hasImage) {
    const dataUrl = `data:${body.mimeType ?? "image/jpeg"};base64,${body.imageBase64}`;
    const parts: { type: string; text?: string; image_url?: { url: string } }[] = [
      { type: "image_url", image_url: { url: dataUrl } },
    ];
    if (hasText) {
      parts.push({ type: "text", text: `Thema/Hinweis: ${body.explanation!.trim()}` });
    }
    userContent = parts;
  } else {
    userContent = `Erstelle Lernkarten aus diesem Inhalt:\n\n${body.explanation!.trim()}`;
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
        { role: "system", content: systemPrompt },
        { role: "user",   content: userContent },
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
  const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const cards = JSON.parse(cleaned) as { front: string; back: string }[];
    return NextResponse.json({ cards });
  } catch {
    return NextResponse.json({ error: "Konnte Karten nicht parsen.", raw }, { status: 500 });
  }
}
