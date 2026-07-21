// app/api/test-key/route.ts
// Called from the setup page. The token is NOT stored on the server — it's
// only forwarded to TTS Monster for validation, then the result (user info +
// voice list) is sent back to the browser.
import { NextRequest, NextResponse } from "next/server";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders();

  let token: string | undefined;
  try {
    const body = await req.json();
    token = body?.token;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers });
  }

  if (!token || !token.trim()) {
    return NextResponse.json({ error: "Token is empty" }, { status: 400, headers });
  }

  try {
    const [userRes, voicesRes] = await Promise.all([
      fetch("https://api.console.tts.monster/user", {
        method: "POST",
        headers: { Authorization: token },
      }),
      fetch("https://api.console.tts.monster/voices", {
        method: "POST",
        headers: { Authorization: token },
      }),
    ]);

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Token is invalid or was rejected by TTS Monster" },
        { status: 401, headers }
      );
    }

    const user = await userRes.json();
    const voicesData = voicesRes.ok
      ? await voicesRes.json()
      : { voices: [], customVoices: [] };

    return NextResponse.json(
      {
        valid: true,
        user,
        voices: voicesData.voices || [],
        customVoices: voicesData.customVoices || [],
      },
      { status: 200, headers }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach TTS Monster", detail: (err as Error).message },
      { status: 500, headers }
    );
  }
}