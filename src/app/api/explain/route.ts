import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { front, back, level, mode, userQuestion, imageBase64 } = body;

  if (!front) {
    return NextResponse.json({ error: "Missing front" }, { status: 400 });
  }

  const apiKey = process.env.THAURA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "THAURA_API_KEY not configured" }, { status: 500 });
  }

  // ── Build prompts based on mode ───────────────────────────────────────────
  let systemPrompt: string;
  let userPrompt: string;

  const levelInstructions: Record<string, string> = {
    leicht:
      "Erkläre es sehr einfach und mit einem Alltagsbeispiel, als würdest du mit einem Schüler der 8. Klasse sprechen. Maximal 2–3 kurze Sätze.",
    mittel:
      "Erkläre es auf Oberstufen-/Studienbeginner-Niveau mit etwas Kontext und einem Merksatz am Ende. Maximal 3–4 Sätze.",
    schwer:
      "Erkläre es ausführlich und fachlich korrekt auf Universitätsniveau mit allen relevanten Zusammenhängen. Maximal 5–6 Sätze.",
  };

  if (mode === "cards") {
    // Generate VORNE/HINTEN flashcards from arbitrary content
    systemPrompt =
      "Du bist ein deutschsprachiger Lernassistent. Erstelle Lernkarten aus dem gegebenen Inhalt. " +
      "Kein Markdown, kein Fettdruck.";
    userPrompt =
      `${front}\n\n` +
      "Erstelle 5 Lernkarten im Format:\n" +
      "VORNE: [Begriff oder Frage]\nHINTEN: [Antwort oder Erklärung]\n---\n" +
      "Antworte nur mit den Karten, kein weiterer Text.";
  } else if (mode === "analyze") {
    // Analyze captured content (image / pasted text)
    const instruction = levelInstructions[level] ??
      "Erkläre es klar und verständlich auf mittlerem Niveau mit einem Merksatz.";
    systemPrompt =
      `Du bist ein deutschsprachiger Lernassistent. Analysiere und erkläre den Inhalt. ${instruction} ` +
      "Antworte auf Deutsch. Kein Markdown, kein Fettdruck.";
    userPrompt = front;
  } else if (mode === "chat") {
    // Interactive Q&A about a flashcard
    systemPrompt =
      `Du bist ein hilfreicher Lernassistent. Der Lernende hat eine Frage zu diesem Lernkarteninhalt:\n` +
      `Begriff: "${front}"\nAntwort: "${back ?? ""}"\n\n` +
      "Beantworte die Frage kurz und präzise auf Deutsch. Kein Markdown.";
    userPrompt = userQuestion || front;
  } else {
    // Default: explain a flashcard at the selected difficulty level
    const instruction =
      levelInstructions[level] ??
      "Erkläre diesen Begriff kurz und verständlich. Was macht ihn wichtig und wie merkt man ihn sich gut?";
    systemPrompt =
      `Du bist ein KI-Lernassistent für Synapze. ${instruction} ` +
      "Antworte auf Deutsch. Kein Markdown, kein Fettdruck.";
    userPrompt = `Lernkarte:\nBegriff: ${front}\nAntwort: ${back ?? ""}`;
  }

  // ── Build messages (with optional vision) ────────────────────────────────
  type MsgContent = string | { type: string; text?: string; image_url?: { url: string } }[];
  const messages: { role: "system" | "user"; content: MsgContent }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (imageBase64) {
    messages.push({
      role: "user",
      content: [
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        { type: "text", text: userPrompt },
      ],
    });
  } else {
    messages.push({ role: "user", content: userPrompt });
  }

  // ── Call Thaura API ───────────────────────────────────────────────────────
  const thauraRes = await fetch("https://backend.thaura.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "thaura", stream: true, messages }),
  });

  if (!thauraRes.ok) {
    const text = await thauraRes.text();
    console.error("Thaura API error:", thauraRes.status, text);
    return NextResponse.json({ error: "Thaura API error" }, { status: 502 });
  }

  // Proxy the SSE stream back to the client
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
