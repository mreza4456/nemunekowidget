"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Music2, ExternalLink, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ErrorFromQuery({ onError }: { onError: (msg: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const err = searchParams.get("error");
    if (err) {
      onError(
        `Login failed: ${err}. Make sure the Redirect URI is registered correctly in the Spotify Developer Dashboard.`
      );
    }
  }, [searchParams, onError]);
  return null;
}

export default function SetupFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    setRedirectUri(`${window.location.origin}/spotify/api/callback`);
  }, []);

  function goToStep2() {
    const cid = clientId.trim();
    const cs = clientSecret.trim();
    if (!cid || !cs) {
      setError("Client ID and Client Secret are required.");
      return;
    }
    setError("");
    sessionStorage.setItem("sp_cid", cid);
    sessionStorage.setItem("sp_cs", cs);
    setStep(2);
  }

  function goToStep1() {
    setStep(1);
  }

  function handleSpotifyLogin() {
    const cid = sessionStorage.getItem("sp_cid");
    const cs = sessionStorage.getItem("sp_cs");
    if (!cid || !cs) {
      goToStep1();
      return;
    }

    const stateObj = JSON.stringify({
      clientId: cid,
      clientSecret: cs,
      redirectUri,
    });
    const state = btoa(unescape(encodeURIComponent(stateObj)));

    const url =
      "https://accounts.spotify.com/authorize?" +
      new URLSearchParams({
        response_type: "code",
        client_id: cid,
        scope: "user-read-currently-playing user-read-playback-state",
        redirect_uri: redirectUri,
        state,
      });

    window.location.href = url;
  }

  return (
    <div className="min-h-screen  mx-auto bg-muted/30 px-4 py-10">
      <Suspense fallback={null}>
        <ErrorFromQuery onError={setError} />
      </Suspense>

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white">
            <Music2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Now Playing</h1>
            <p className="text-sm text-muted-foreground">Spotify Setup</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 1 ? "bg-green-500" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step >= 2 ? "bg-green-500" : "bg-muted"
            }`}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="flex  gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 1 — Spotify App</CardTitle>
                <CardDescription>
                  You need an app in the Spotify Developer Dashboard to get a
                  Client ID and Secret.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      1
                    </span>
                    <span>
                      Go to{" "}
                      <a
                        href="https://developer.spotify.com/dashboard"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-green-600 underline-offset-4 hover:underline"
                      >
                        developer.spotify.com/dashboard
                        <ExternalLink className="h-3 w-3" />
                      </a>{" "}
                      and log in.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      2
                    </span>
                    <span>
                      Click <strong>Create app</strong> → enter any name →
                      check <strong>Web API</strong>.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      3
                    </span>
                    <span>
                      Under <strong>Redirect URIs</strong>, add the URL below.
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      4
                    </span>
                    <span>
                      Copy the <strong>Client ID</strong> and{" "}
                      <strong>Client Secret</strong> from the Settings page.
                    </span>
                  </li>
                </ol>

                <div className="rounded-md border bg-muted/50 p-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Redirect URI to register
                  </p>
                  <p className="break-all font-mono text-xs">{redirectUri}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enter your credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="a1b2c3d4e5f6..."
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="clientSecret"
                      type={showSecret ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                      aria-label={showSecret ? "Hide secret" : "Show secret"}
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your client secret is never sent to any server — it&apos;s
                    only stored temporarily in your browser to build the link.
                  </p>
                </div>

                <Button className="w-full mt-20" onClick={goToStep2}>
                  Continue to Spotify login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Step 2 — Authorize Spotify
                </CardTitle>
                <CardDescription>
                  Click the button below to log in to Spotify and grant
                  permission to read what you&apos;re currently playing.
                  You&apos;ll be redirected back to this page automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/50 p-3 text-sm">
                  <span className="font-medium">Permissions requested: </span>
                  only reading the currently playing track. No permission to
                  modify playlists or your account.
                </div>

                <Button
                  className="w-full bg-green-500 text-white hover:bg-green-600"
                  onClick={handleSpotifyLogin}
                >
                  <Music2 className="mr-2 h-4 w-4" />
                  Log in with Spotify
                </Button>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle className="text-sm">After you log in...</CardTitle>
                <CardDescription>
                  The proxy URL and widget code will appear automatically on
                  the next page. Just copy and paste it into StreamElements.
                </CardDescription>
              </CardHeader>
            </Card>

            <Button variant="ghost" onClick={goToStep1} className="self-start">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to edit credentials
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}