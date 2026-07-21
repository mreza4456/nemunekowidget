// app/api/voices/route.ts
// GET request -> returns the list of voice_ids available on your TTS Monster account
// Access via browser: https://your-proxy.vercel.app/api/voices
import { NextResponse } from "next/server";

export async function GET() {
  const headers = { "Access-Control-Allow-Origin": "*" };

  try {
    const apiKey = process.env.TTS_MONSTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "TTS_MONSTER_API_KEY is not set in environment variables" },
        { status: 500, headers }
      );
    }

    const voicesRes = await fetch("https://api.console.tts.monster/voices", {
      method: "POST",
      headers: { Authorization: apiKey },
    });

    const data = await voicesRes.json();
    return NextResponse.json(data, { status: 200, headers });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal proxy error", detail: (err as Error).message },
      { status: 500, headers }
    );
  }
}