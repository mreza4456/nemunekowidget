"use client";

import { useMemo, useState } from "react";
import { Zap, Copy, Check, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

/* ── Types ────────────────────────────────────────────────── */
type Field = {
  type: string;
  label?: string;
  value?: string | number;
  group?: string;
  options?: Record<string, string>;
  min?: number;
  max?: number;
  steps?: number;
};
type FieldMap = Record<string, Field>;

/* ── Data ─────────────────────────────────────────────────── */
const ALERT_OPTS: Record<string, string> = {
  none: "None",
  follower: "Follower",
  subscriber: "Subscriber",
  tip: "Tip",
  cheer: "Cheer",
  welcome: "Welcome",
  "gifted-subs": "Gifted Subs",
  "community-gift": "Community Gift",
  raid: "raid",
  reedem: "Item Redemption",
  superchat: "Superchat",
  member: "MemberYT",
};

const TRIGGER_OPTS: Record<string, string> = {
  none: "None",
  everyone: "Everyone",
  broadcasterAndmoderator: "Streamer And Mods",
  broadcasterAndmoderatorAndvip: "Streamer, Moderator And Vip",
  broadcasterAndmoderatorAndvipAndsubscriber:
    "Streamer, Moderator, Vip And Subscriber",
  viewer: "Viewer",
  moderator: "Moderator",
  vip: "Vip",
  subscriber: "Subscriber",
  broadcaster: "Broadcaster",
  owner: "YtOwner",
  moderatorYT: "Moderator YT",
  member: "MemberYT",
  verived: "Veriv YT",
  viewerYT: "ViewerYT",
};

/* ── Builders ─────────────────────────────────────────────── */
function buildSimulate(): FieldMap {
  return {
    buttonTest: { type: "button", label: "Dev Beta ", group: "🧪 Simulate Triggered Comand" },
    buttonYTOwner: { type: "button", label: "Owner", group: "🧪 Simulate Command YT" },
    buttonYTModerator: { type: "button", label: "Moderator", group: "🧪 Simulate Command YT" },
    buttonYTVerived: { type: "button", label: "Verived", group: "🧪 Simulate Command YT" },
    buttonYTMember: { type: "button", label: "Member", group: "🧪 Simulate Command YT" },
    buttonYTAnonymous: { type: "button", label: "Anonymous", group: "🧪 Simulate Command YT" },
  };
}

function buildAlerts(): FieldMap {
  return {
    subMessage: { type: "text", label: "Subscriber Alert Message", value: "Thank you, {name}, for subscribing!", group: "🔔 Alert Setting" },
    folowersMessage: { type: "text", label: "Folower Alert Message", value: "Thank you, {name}, for following", group: "🔔 Alert Setting" },
    tipMessage: { type: "text", label: "Tip Alert Message", value: "Thank you, {name}, for your generous {amount} donation! 🎉 Message: {message}", group: "🔔 Alert Setting" },
    cheerMessage: { type: "text", label: "Cheer Alert Message", value: "Thank you, {name}, for your {amount} bits cheer! 🎉 Message: {message}", group: "🔔 Alert Setting" },
    giftedSubsMessage: { type: "text", label: "Gifted Subs Alert Message", value: "{gifterName} gifted a sub to {name}!", group: "🔔 Alert Setting" },
    communityGiftMessage: { type: "text", label: "Community Gift Alert Message", value: "{gifterName} gifted {giftAmount} subs to the community! 🎁", group: "🔔 Alert Setting" },
    raid: { type: "text", label: "Raid Alert Message", value: "{raidName} has gifted {raidAmount} subs to the community! Message: {message}", group: "🔔 Alert Setting" },
    redemption: { type: "text", label: "Item Redemption Alert Message", value: "{name} spent points to redeem {iteem} Message: {message}", group: "🔔 Alert Setting" },
    welcomeMessage: { type: "text", label: "Welcome Alert Message", value: "Welcome to the stream, {name}! 👋😊", group: "🔔 Alert Setting" },
  };
}

function buildAnim(n: number): FieldMap {
  const group = n === 0 ? "🎬 Default Animation" : `🎥 Animation ${n}`;
  return {
    [`animCommand${n}`]: { type: "text", label: "Type Comand Here", value: "!pd", group },
    [`Reactive With Alert${n}`]: { type: "dropdown", label: "Reactive With Alert", value: "none", options: ALERT_OPTS, group },
    [`Comand Trigered By${n}`]: { type: "dropdown", label: "Comand Trigered By", value: "none", options: TRIGGER_OPTS, group },
    [`anim${n}Text`]: { type: "text", label: "Pet reply", value: "", group },
    [`animImage${n}`]: { type: "image-input", label: group, group },
    [`image${n}Size`]: { type: "text", label: "Image Size", value: 400, group },
    [`font${n}Size`]: { type: "input", label: "Font Size", value: 16, group },
    [`vertikalBox${n}`]: { type: "input", label: "vertikal Box Chat", value: 0, group },
    [`horizontalBox${n}`]: { type: "input", label: "horizontal Box Chat", value: 0, group },
    [`anim${n}Time`]: { type: "number", label: "Animation Duration(seconds)", value: 5000, group },
    [`anim${n}Sound`]: { type: "sound-input", label: "Audio", group },
    [`volumeSlider${n}`]: { type: "input", label: "Sound Volume", value: 50, min: 0, max: 100, steps: 1, group },
  };
}

function buildYTAlerts(): FieldMap {
  return {
    superchatMessage: { type: "text", label: "Superchat Alert Message", value: "🎉 {name} just sent a Superchat of {amount}! Thank you for the support 🙌", group: "🔔 YT Alert Setting" },
    memberMessage: { type: "text", label: "Member Alert Message", value: "🎉 {name} just became a channel member! Welcome to the community 🙌", group: "🔔 YT Alert Setting" },
  };
}

function buildBranding(): FieldMap {
  return {
    widgetPersonalize: { label: "Personalize Stream Widget", type: "text", value: "Made by @UsbiafCreativeStudio", group: "🎨 UsbiafCreativeStudio" },
    widgetPersonalizee: { label: "Made by @UsbiafCreativeStudio", type: "text", value: "@UsbuafCreativeStudio All right reserved", group: "🎨 UsbiafCreativeStudio" },
  };
}

function buildAll(count: number): FieldMap {
  const obj: FieldMap = {};
  Object.assign(obj, buildSimulate());
  Object.assign(obj, buildAlerts());
  Object.assign(obj, buildYTAlerts());
  for (let i = 0; i <= count; i++) Object.assign(obj, buildAnim(i));
  Object.assign(obj, buildBranding());
  return obj;
}

/* ── Syntax highlight ─────────────────────────────────────── */
function syntaxHighlight(json: string) {
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (m) => {
      if (/^"/.test(m)) {
        return /:$/.test(m)
          ? `<span class="text-sky-400">${m}</span>`
          : `<span class="text-emerald-400">${m}</span>`;
      }
      if (/true|false/.test(m)) return `<span class="text-purple-400">${m}</span>`;
      if (/null/.test(m)) return `<span class="text-purple-400">${m}</span>`;
      return `<span class="text-amber-400">${m}</span>`;
    }
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function FieldDataGeneratorPage() {
  const [count, setCount] = useState(6);
  const [tab, setTab] = useState<"json" | "preview">("json");
  const [copied, setCopied] = useState(false);

  const obj = useMemo(() => buildAll(count), [count]);
  const raw = useMemo(() => JSON.stringify(obj, null, 2), [obj]);

  const keys = Object.keys(obj).length;
  const bytes = (new TextEncoder().encode(raw).length / 1024).toFixed(1);
  const groups = new Set(
    Object.values(obj)
      .map((v) => v.group)
      .filter(Boolean)
  ).size;

  const chipLabels = [
    "Default",
    ...Array.from({ length: count }, (_, i) => "Anim " + (i + 1)),
  ];
  const shownChips = chipLabels.slice(0, 14);
  const extraChips = chipLabels.length - shownChips.length;

  const previewGroups = useMemo(() => {
    const groupsMap: Record<string, { key: string; type: string; label?: string }[]> = {};
    Object.entries(obj).forEach(([k, v]) => {
      const g = v.group || "Ungrouped";
      if (!groupsMap[g]) groupsMap[g] = [];
      groupsMap[g].push({ key: k, type: v.type, label: v.label });
    });
    return groupsMap;
  }, [obj]);

  function updateCount(next: number) {
    setCount(Math.min(99, Math.max(1, next)));
  }

  function handleCopy() {
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "field.txt",
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
     

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Number of Animations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Enter the total number of animations
              </p>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">Total Animations</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCount(count - 1)}
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    value={count}
                    min={1}
                    max={99}
                    onChange={(e) => updateCount(parseInt(e.target.value) || 1)}
                    className="h-8 w-16 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => updateCount(count + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {shownChips.map((label, i) => (
                  <span
                    key={label}
                    className={`rounded-full border px-2 py-0.5 text-xs ${
                      i === 0
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                ))}
                {extraChips > 0 && (
                  <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                    +{extraChips} more
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Animations", value: count + 1 },
                  { label: "Total Keys", value: keys },
                  { label: "Size (KB)", value: bytes },
                  { label: "Groups", value: groups },
                ].map((s) => (
                  <div key={s.label} className="rounded-md border p-3">
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Output panel */}
        <Card className="flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <Tabs value={tab} onValueChange={(v) => setTab(v as "json" | "preview")}>
              <TabsList>
                <TabsTrigger value="json">JSON</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                ) : (
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download
              </Button>
              <span className="text-xs text-muted-foreground">{keys} keys</span>
            </div>
          </div>

          <CardContent className="p-0">
            {tab === "json" && (
              <pre
                className="max-h-[70vh] overflow-auto bg-neutral-800 p-4 text-xs leading-relaxed text-neutral-200"
                dangerouslySetInnerHTML={{ __html: syntaxHighlight(raw) }}
              />
            )}

            {tab === "preview" && (
              <div className="max-h-[70vh] space-y-6 overflow-auto p-4">
                {Object.entries(previewGroups).map(([g, fields]) => (
                  <div key={g}>
                    <div className="mb-2 text-sm font-medium">{g}</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {fields.map((f) => (
                        <div
                          key={f.key}
                          className="rounded-md border p-2 text-xs"
                        >
                          <div className="truncate font-mono font-medium">
                            {f.key}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            {f.type}
                            {f.label ? ` · ${f.label.substring(0, 20)}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}