"use client";

import { useEffect, useState } from "react";
import { PartyPopper, ShieldAlert, Copy, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SuccessPage() {
  const [token, setToken] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fragment (#t=...) tidak pernah dikirim ke server, jadi hanya bisa
    // dibaca di client, persis seperti versi vanilla (success.html).
    const hash = window.location.hash; // "#t=xxxxx"
    const match = hash.match(/t=([^&]+)/);
    if (match) {
      const t = decodeURIComponent(match[1]);
      setToken(t);
      setWidgetUrl(`${window.location.origin}/api/now-playing?t=${t}`);
    }
  }, []);

  function handleCopy() {
    if (!widgetUrl) return;
    navigator.clipboard.writeText(widgetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white">
            <PartyPopper className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Now Playing</h1>
            <p className="text-sm text-muted-foreground">Setup complete</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Successfully connected</CardTitle>
            {!token && (
              <CardDescription>
                No token found in the URL. Try restarting the login process
                from the setup page.
              </CardDescription>
            )}
          </CardHeader>

          {token && (
            <CardContent className="space-y-4">
              <CardDescription>
                Here&apos;s your widget URL. Paste it into a Browser Source in
                OBS, or as a Custom Widget URL in StreamElements.
              </CardDescription>

              <div className="space-y-2">
                <Textarea
                  readOnly
                  value={widgetUrl}
                  className="min-h-[80px] resize-none font-mono text-xs"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button className="w-full" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertDescription>
                  This URL contains a base64-encoded access token — don&apos;t
                  share it with anyone, since whoever has it can read your
                  Spotify account&apos;s currently-playing status.
                </AlertDescription>
              </Alert>
            </CardContent>
          )}
        </Card>

        <Button variant="ghost"  className="self-start">
          <Link href="/" className="flex">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to setup page
          </Link>
        </Button>
      </div>
    </div>
  );
}