import { NextRequest, NextResponse } from "next/server";

// GET /api/callback — terima kode OAuth dari Spotify, tukar jadi token,
// lalu redirect ke halaman success dengan token terenkode di URL fragment.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const origin = req.nextUrl.origin;

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=missing_params", origin));
  }

  let stateData: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };

  try {
    const decoded = Buffer.from(state, "base64").toString("binary");
    stateData = JSON.parse(decodeURIComponent(escape(decoded)));
  } catch {
    return NextResponse.redirect(new URL("/?error=invalid_state", origin));
  }

  const { clientId, clientSecret, redirectUri } = stateData;

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
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await r.json();

    if (data.error || !data.access_token) {
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent(
            data.error_description || data.error || "token_failed"
          )}`,
          origin
        )
      );
    }

    // Enkode token + credentials ke base64 — ini yang disimpan di widget SE
    const tokenPayload = Buffer.from(
      JSON.stringify({
        access: data.access_token,
        refresh: data.refresh_token,
        clientId,
        clientSecret,
      })
    ).toString("base64");

    // Redirect ke halaman sukses dengan token di URL fragment (#) —
    // tidak pernah dikirim ke server.
    return NextResponse.redirect(
      new URL(`/success#t=${encodeURIComponent(tokenPayload)}`, origin)
    );
  } catch {
    return NextResponse.redirect(new URL("/?error=fetch_failed", origin));
  }
}