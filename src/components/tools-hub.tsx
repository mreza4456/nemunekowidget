"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Zap,
  FileJson,
  Eye,
  Music,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

import type { DocsWithSteps } from "@/lib/docs/query"; // ⬅️ adjust to match the real export location

/* Icons cycle for tools — the docs table has no icon column, so we rotate a small set by index */
const ICONS = [Zap, Music, Eye, FileJson];

/** Turn any common YouTube URL (watch, youtu.be, shorts, already-embed) into an embeddable URL */
function getYoutubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (parsed.pathname.startsWith("/embed/")) {
      return url;
    }

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;

      const shortsMatch = parsed.pathname.match(/\/shorts\/([^/]+)/);
      if (shortsMatch) return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    return null;
  } catch {
    return null;
  }
}

/** Treat anything other than "available" as "coming soon".
 *  ⬇️ Adjust this comparison if your DocsStatus enum uses different literal values. */
function isAvailable(status: DocsWithSteps["status"]) {
  return String(status).toLowerCase() === "published";
}

export default function ToolsHubClient({ docs }: { docs: DocsWithSteps[] }) {
  const [activeId, setActiveId] = useState<string | undefined>(docs[0]?.id);
  const active = docs.find((d) => d.id === activeId) ?? docs[0];

  if (!active) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">
          No tools have been published yet.
        </p>
      </div>
    );
  }

  const embedUrl = getYoutubeEmbedUrl(active.link_youtube);
  const available = isAvailable(active.status);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="text-sm font-semibold tracking-tight">
          NEMUNEKO WIDGET
        </div>
        <Badge variant="secondary">v2.0</Badge>
      </header>

      <div className="mx-auto grid grid-cols-1 gap-6 px-20 py-10 lg:grid-cols-[260px_1fr]">
        {/* Sidebar: tool list */}
        <aside className="space-y-2">
          <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tools
          </p>
          {docs.map((doc, index) => {
            const Icon = ICONS[index % ICONS.length];
            const docAvailable = isAvailable(doc.status);
            return (
              <button
                key={doc.id}
                onClick={() => setActiveId(doc.id)}
                className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors ${
                  activeId === doc.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                    activeId === doc.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">
                      {doc.docs_name}
                    </span>
                    {!docAvailable && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        Soon
                      </Badge>
                    )}
                  </div>
                  {doc.description && (
                    <div dangerouslySetInnerHTML={{ __html: doc.description }} className="truncate text-xs text-muted-foreground"/>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        {/* Main: selected tool docs */}
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {active.docs_name}
                </h1>
                {available ? (
                  <Badge className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    Coming soon
                  </Badge>
                )}
              </div>
              {active.description && (
                 <div dangerouslySetInnerHTML={{ __html: active.description }} className="max-w-xl text-sm text-muted-foreground"/>
              )}
            </div>

            {active.link_app ? (
              <Link href={active.link_app} target="_blank" rel="noopener noreferrer">
                <Button disabled={!available}>
                  Open tool
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button disabled>
                Open tool
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            )}
          </div>

          <Separator />

          <Tabs defaultValue="steps">
            <TabsList>
              <TabsTrigger value="steps">Steps</TabsTrigger>
              {embedUrl && <TabsTrigger value="video">Video</TabsTrigger>}
            </TabsList>

            <TabsContent value="steps" className="mt-4">
              {active.steps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No steps have been added for this tool yet.
                </p>
              ) : (
                <div className="space-y-6">
                  {active.steps.map((s, i) => (
                    <div key={s.id} className="flex gap-4">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-slate-900 text-white font-bold text-xs font-medium">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className="text-sm font-medium">{s.title}</h3>
                        {s.description && (
                            <div dangerouslySetInnerHTML={{ __html: s.description }} className=" text-sm  prose"/>
                        )}
                        {s.image && (
                          <div className="overflow-hidden rounded-md border">
                            {/* Plain <img> to avoid next/image remotePatterns config for
                                whatever storage host (e.g. Supabase Storage) serves these */}
                            <img
                              src={s.image}
                              alt={s.title}
                              className="h-auto w-full max-w-md object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {embedUrl && (
              <TabsContent value="video" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Demo video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video w-full overflow-hidden rounded-md">
                      <iframe
                        src={embedUrl}
                        title={`${active.docs_name} demo video`}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}