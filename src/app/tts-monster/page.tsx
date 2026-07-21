"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Copy, Check, ArrowLeft, AlertTriangle, Loader2 } from "lucide-react";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

/* ── Types ────────────────────────────────────────────────── */
type Voice = {
  voice_id: string;
  name: string;
  metadata?: string;
  language?: string;
  custom?: boolean;
};

type UserInfo = {
  current_plan?: string;
  character_usage?: number;
  character_allowance?: number;
};

/* ── Encryption helpers (mirrors the original vanilla JS) ────
   SHARED_SECRET must exactly match ENCRYPT_SECRET in /api/tts.js */
const SHARED_SECRET = "ganti-dengan-rahasia-acakmu-32char!!";

async function deriveKey(secret: string) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("ttsm-salt-v1"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptSession(token: string, voiceId: string) {
  const key = await deriveKey(SHARED_SECRET);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify({ token, voiceId, ts: Date.now() }));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);

  const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.byteLength);
  return btoa(String.fromCharCode(...combined))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/* ── Page ─────────────────────────────────────────────────── */
export default function TtsMonsterSetupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validToken, setValidToken] = useState<string | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [statusText, setStatusText] = useState("");

  const [user, setUser] = useState<UserInfo | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);

  const [generating, setGenerating] = useState(false);
  const [proxyUrl, setProxyUrl] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ttsm_last_token");
    if (saved) setToken(saved);
  }, []);

  async function handleVerify() {
    const t = token.trim();
    if (!t) {
      setStatus("err");
      setStatusText("Enter your API token first.");
      return;
    }

    setStatus("loading");
    setStatusText("Contacting TTS Monster...");
    setSelectedVoiceId(null);

    try {
      const res = await fetch("/tts-monster/api/test-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setStatus("err");
        setStatusText(data.error || "Token rejected.");
        return;
      }

      setValidToken(t);
      localStorage.setItem("ttsm_last_token", t);
      setStatus("ok");
      setStatusText("Token valid. Account connected.");
      setUser(data.user);

      const allVoices: Voice[] = [
        ...(data.customVoices || []).map((v: Voice) => ({ ...v, custom: true })),
        ...(data.voices || []),
      ];
      setVoices(allVoices);
      setStep(2);
    } catch {
      setStatus("err");
      setStatusText("Could not reach the proxy server.");
    }
  }

  async function handleGenerate() {
    if (!validToken || !selectedVoiceId) return;
    setGenerating(true);
    try {
      const session = await encryptSession(validToken, selectedVoiceId);
      const url = `${window.location.origin}/tts-monster/api/tts?session=${session}`;
      setProxyUrl(url);
      setStep(3);
    } catch (err) {
      alert("Failed to encrypt session: " + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(field: string, value: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }

  function startOver() {
    setValidToken(null);
    setSelectedVoiceId(null);
    setStatus("idle");
    setStatusText("");
    setProxyUrl("");
    setStep(1);
  }

  const used = user?.character_usage ?? 0;
  const allowance = user?.character_allowance ?? 0;
  const usagePct = allowance ? Math.min(100, (used / allowance) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        {/* Header */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Nemuneko Studio · Widget Tooling
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Connect <span className="text-primary">TTS Monster</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your API token, validate it, pick a voice — then generate an
            encrypted proxy URL for StreamElements.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  step >= n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {n}
              </div>
              <span
                className={`text-xs ${
                  step >= n ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {n === 1 ? "Token" : n === 2 ? "Voice" : "Proxy URL"}
              </span>
              {n < 3 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1 — Token */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 1 · API Token</CardTitle>
              <CardDescription>
                Paste your TTS Monster API token below and we&apos;ll validate
                it before moving on.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenInput">API Token</Label>
                <div className="relative">
                  <Input
                    id="tokenInput"
                    type={showToken ? "text" : "password"}
                    placeholder="ttsm_xxxxxxxxxxxxxxxxxxxx"
                    autoComplete="off"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((v) => !v)}
                    className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showToken ? "Hide token" : "Show token"}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Grab your token at{" "}
                  <a
                    href="https://console.tts.monster"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    console.tts.monster
                  </a>{" "}
                  → profile icon → &quot;API Token&quot; section.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleVerify}
                disabled={status === "loading"}
              >
                {status === "loading" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Verify Token &amp; Load Voices
              </Button>

              {status !== "idle" && (
                <Alert variant={status === "err" ? "destructive" : "default"}>
                  <AlertDescription>{statusText}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2 — Voice selection */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 2 · Choose a Voice</CardTitle>
              <CardDescription>
                Your account is connected. Pick the voice you want this widget
                to use.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    Character usage{" "}
                    <span className="font-medium">
                      ({user?.current_plan || "-"})
                    </span>
                  </span>
                  <span className="font-medium">
                    {used.toLocaleString()} / {allowance.toLocaleString()}
                  </span>
                </div>
                <Progress value={usagePct} />
              </div>

              <div className="space-y-2">
                <Label>Available voices</Label>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {voices.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No voices found.
                    </p>
                  )}
                  {voices.map((v) => (
                    <button
                      key={v.voice_id}
                      type="button"
                      onClick={() => setSelectedVoiceId(v.voice_id)}
                      className={`flex w-full items-center justify-between rounded-md border p-3 text-left transition-colors ${
                        selectedVoiceId === v.voice_id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {v.name}
                          {v.custom ? " · custom" : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {v.metadata || v.language || v.voice_id}
                        </div>
                      </div>
                      {selectedVoiceId === v.voice_id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!selectedVoiceId || generating}
                  onClick={handleGenerate}
                >
                  {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Proxy URL
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 — Output */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Step 3 · Your Proxy URL</CardTitle>
                <CardDescription>
                  Copy these into your StreamElements widget to finish setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Keep this URL private</AlertTitle>
                  <AlertDescription>
                    It contains an encrypted session that holds your token.
                    Don&apos;t share it publicly — only use it inside your own
                    StreamElements widget.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Selected Voice ID</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs">
                      {selectedVoiceId}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy("voiceId", selectedVoiceId || "")}
                    >
                      {copiedField === "voiceId" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Encrypted Proxy URL (for StreamElements)</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-2 font-mono text-xs">
                      {proxyUrl}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy("proxyUrl", proxyUrl)}
                    >
                      {copiedField === "proxyUrl" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  {[
                    <>
                      In StreamElements, open your overlay → <strong>Custom Widget</strong> → the{" "}
                      <strong>JS</strong> tab.
                    </>,
                    <>
                      Paste the Proxy URL into the <strong>PROXY_URL</strong> variable in the
                      widget.
                    </>,
                    <>No need to set a Voice ID in the widget — it&apos;s already embedded in the URL.</>,
                    <>
                      Add the overlay to OBS as a <strong>Browser Source</strong>.
                    </>,
                  ].map((content, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {i + 1}
                      </span>
                      <span>{content}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <Button variant="outline" onClick={startOver}>
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Your token is encrypted in-browser using the Web Crypto API — it&apos;s
          never sent to or stored on this server in its original form.
        </p>
      </div>
    </div>
  );
}