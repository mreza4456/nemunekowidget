import { NextRequest, NextResponse } from "next/server";

type Tokens = {
  access: string;
  refresh: string;
  clientId: string;
  clientSecret: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encodedToken = searchParams.get("t");

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (!encodedToken) {
    return NextResponse.json(
      { error: "missing_token", isPlaying: false },
      { status: 400, headers }
    );
  }

  let tokens: Tokens;
  try {
    tokens = JSON.parse(Buffer.from(encodedToken, "base64").toString("utf8"));
  } catch {
    return NextResponse.json(
      { error: "invalid_token", isPlaying: false },
      { status: 400, headers }
    );
  }

  let { access } = tokens;
  const { refresh, clientId, clientSecret } = tokens;
  if (!access || !refresh || !clientId || !clientSecret) {
    return NextResponse.json(
      { error: "incomplete_token", isPlaying: false },
      { status: 400, headers }
    );
  }

  let result = await fetchCurrentlyPlaying(access);
  let newEncodedToken: string | null = null;

  if (result.status === 401) {
    const newAccess = await refreshAccessToken(refresh, clientId, clientSecret);
    if (!newAccess) {
      return NextResponse.json(
        { isPlaying: false, error: "refresh_failed" },
        { headers }
      );
    }
    result = await fetchCurrentlyPlaying(newAccess);
    newEncodedToken = Buffer.from(
      JSON.stringify({ access: newAccess, refresh, clientId, clientSecret })
    ).toString("base64");
    access = newAccess;
  }

  const responseHeaders: Record<string, string> = { ...headers };
  if (newEncodedToken) {
    responseHeaders["X-New-Token"] = newEncodedToken;
  }

  if (result.status === 204 || !result.data) {
    return NextResponse.json({ isPlaying: false }, { headers: responseHeaders });
  }

  if (!result.data.item) {
    return NextResponse.json({ isPlaying: false }, { headers: responseHeaders });
  }

  const item = result.data.item;

  // tempo dari audio-features — dibungkus try/catch supaya podcast/episode
  // (yang tidak punya audio-features) tidak bikin request gagal total.
  let tempo: number | null = null;
  try {
    const fr = await fetch(
      `https://api.spotify.com/v1/audio-features/${item.id}`,
      { headers: { Authorization: `Bearer ${access}` } }
    );
    const features = await fr.json();
    tempo = features?.tempo ?? null;
  } catch {
    tempo = null;
  }

  return NextResponse.json(
    {
      isPlaying: result.data.is_playing,
      title: item.name,
      artist: item.artists.map((a: { name: string }) => a.name).join(", "),
      album: item.album.name,
      art: item.album.images[0]?.url ?? "",
      progress: result.data.progress_ms,
      duration: item.duration_ms,
      tempo, // null kalau podcast/episode, widget fallback ke 120 BPM
    },
    { headers: responseHeaders }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

async function fetchCurrentlyPlaying(accessToken: string) {
  const r = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (r.status === 204) return { status: 204, data: null };
  if (r.status === 401) return { status: 401, data: null };
  try {
    const data = await r.json();
    return { status: r.status, data };
  } catch {
    return { status: r.status, data: null };
  }
}

async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
) {
  try {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const data = await r.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}