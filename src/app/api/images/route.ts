import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  if (!query.trim()) return NextResponse.json({ images: [] });

  try {
    const apiUrl =
      `https://commons.wikimedia.org/w/api.php` +
      `?action=query&generator=search&gsrnamespace=6` +
      `&gsrsearch=${encodeURIComponent(query)}` +
      `&prop=imageinfo&iiprop=url|thumburl&iiurlwidth=300` +
      `&format=json&origin=*&gsrlimit=16`;

    const res = await fetch(apiUrl, { next: { revalidate: 3600 } });
    const data = await res.json();

    const pages = (data.query?.pages ?? {}) as Record<string, {
      title?: string;
      imageinfo?: { url: string; thumburl: string }[];
    }>;

    const images = Object.values(pages)
      .map((page) => {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl) return null;
        const ext = info.url.split(".").pop()?.toLowerCase() ?? "";
        if (!["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return null;
        return { thumb: info.thumburl, full: info.url, title: (page.title ?? "").replace("File:", "") };
      })
      .filter(Boolean);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
