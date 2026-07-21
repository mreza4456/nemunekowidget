// app/api/tts/route.ts
// Accepts a POST with ?session=xxx (encrypted in the browser).
// Decrypts the session -> gets token + voiceId -> forwards to TTS Monster.
import { NextRequest, NextResponse } from "next/server";
import { createDecipheriv, pbkdf2Sync } from "crypto";

// ⚠️ MUST match SHARED_SECRET in the frontend page exactly.
const SHARED_SECRET = "ganti-dengan-rahasia-acakmu-32char!!";
const SALT = "ttsm-salt-v1";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function deriveKey(secret: string) {
  return pbkdf2Sync(secret, SALT, 100000, 32, "sha256");
}

function decryptSession(sessionB64url: string) {
  const base64 = sessionB64url.replace(/-/g, "+").replace(/_/g, "/");
  const combined = Buffer.from(base64, "base64");

  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);
  const key = deriveKey(SHARED_SECRET);

  // AES-256-GCM: the tag is the last 16 bytes
  const tag = ciphertext.subarray(ciphertext.length - 16);
  const data = ciphertext.subarray(0, ciphertext.length - 16);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as {
    token: string;
    voiceId: string;
    ts: number;
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders();

  const sessionParam = req.nextUrl.searchParams.get("session");
  if (!sessionParam) {
    return NextResponse.json(
      { error: "Missing session parameter in the URL." },
      { status: 400, headers }
    );
  }

  let token: string, voiceId: string;
  try {
    const payload = decryptSession(sessionParam);

    const ageMs = Date.now() - (payload.ts || 0);
    if (ageMs > 30 * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "Session expired. Generate a new URL from the panel." },
        { status: 401, headers }
      );
    }

    token = payload.token;
    voiceId = payload.voiceId;
  } catch (err) {
    return NextResponse.json(
      { error: "Session is invalid or was tampered with.", detail: (err as Error).message },
      { status: 401, headers }
    );
  }

  let message: string | undefined;
  try {
    const body = await req.json();
    message = body?.message;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers });
  }

  if (!message) {
    return NextResponse.json(
      { error: '"message" is required in the request body.' },
      { status: 400, headers }
    );
  }

  try {
    const ttsRes = await fetch("https://api.console.tts.monster/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        voice_id: voiceId,
        message: String(message).slice(0, 500),
      }),
    });

    const data = await ttsRes.json();
    if (!ttsRes.ok) {
      console.error("TTS Monster error:", data);
      return NextResponse.json(
        { error: "TTS Monster API error", detail: data },
        { status: ttsRes.status, headers }
      );
    }

    return NextResponse.json(data, { status: 200, headers }); // { status: 200, url: "https://storage.tts.monster/..." }
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Internal proxy error", detail: (err as Error).message },
      { status: 500, headers }
    );
  }
}