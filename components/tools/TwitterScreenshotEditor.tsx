"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { tweetScreenshotComponents } from "@/components/tools/TweetScreenshotImages";
import { captureNodeAsPng } from "@/lib/twitter-screenshot/export";
import { parseTweetId } from "@/lib/twitter-screenshot/parse";
import { cn } from "@/lib/utils";
import {
  Copy,
  Download,
  ImageIcon,
  Loader2,
  Moon,
  Sun,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { Tweet } from "react-tweet/api";
import { EmbeddedTweet } from "react-tweet";
import { toast } from "sonner";
import "react-tweet/theme.css";

type LayoutPreset = "auto" | "square" | "landscape";

type BackgroundPreset = {
  id: string;
  label: string;
  style: React.CSSProperties;
};

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: "white", label: "White", style: { background: "#ffffff" } },
  { id: "zinc", label: "Zinc", style: { background: "#f4f4f5" } },
  { id: "slate", label: "Slate", style: { background: "#0f172a" } },
  { id: "black", label: "Black", style: { background: "#000000" } },
  {
    id: "sunset",
    label: "Sunset",
    style: {
      background: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    style: {
      background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    },
  },
  {
    id: "forest",
    label: "Forest",
    style: {
      background: "linear-gradient(135deg, #22c55e 0%, #14b8a6 100%)",
    },
  },
  {
    id: "dusk",
    label: "Dusk",
    style: {
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #7c3aed 100%)",
    },
  },
];

const LAYOUT_SIZES: Record<Exclude<LayoutPreset, "auto">, { width: number; height: number }> =
  {
    square: { width: 1080, height: 1080 },
    landscape: { width: 1920, height: 1080 },
  };

export default function TwitterScreenshotEditor() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [tweet, setTweet] = useState<Tweet | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [layout, setLayout] = useState<LayoutPreset>("auto");
  const [backgroundId, setBackgroundId] = useState("sunset");
  const [padding, setPadding] = useState(48);
  const [scale, setScale] = useState(100);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [rounded, setRounded] = useState(true);
  const [shadow, setShadow] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [hideMedia, setHideMedia] = useState(false);

  const background =
    BACKGROUND_PRESETS.find((item) => item.id === backgroundId) ??
    BACKGROUND_PRESETS[0];

  const loadTweet = useCallback(async () => {
    const tweetId = parseTweetId(urlInput);
    if (!tweetId) {
      toast.error("Paste a valid X or Twitter post URL.");
      return;
    }

    setLoading(true);
    setTweet(null);
    try {
      const res = await fetch(`/api/tools/tweet-screenshot?id=${tweetId}`);
      const json = (await res.json()) as { data?: Tweet; error?: string };
      if (!res.ok || !json.data) {
        toast.error(json.error ?? "Could not load that tweet.");
        return;
      }
      setTweet(json.data);
    } catch {
      toast.error("Network error while loading the tweet.");
    } finally {
      setLoading(false);
    }
  }, [urlInput]);

  const exportImage = useCallback(async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await captureNodeAsPng(canvasRef.current);
      const link = document.createElement("a");
      link.download = `tweet-screenshot-${tweet?.id_str ?? "export"}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Screenshot downloaded.");
    } catch {
      toast.error("Export failed. Try again or disable browser extensions.");
    } finally {
      setExporting(false);
    }
  }, [tweet?.id_str]);

  const copyImage = useCallback(async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await captureNodeAsPng(canvasRef.current);
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("Image copied to clipboard.");
    } catch {
      toast.error("Copy failed. Try Download PNG instead.");
    } finally {
      setExporting(false);
    }
  }, []);

  const canvasSize =
    layout === "auto" ? null : LAYOUT_SIZES[layout as Exclude<LayoutPreset, "auto">];

  return (
    <div className="border border-border bg-background/70">
      <div className="grid lg:grid-cols-[minmax(0,320px)_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
        <aside className="p-5 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tweet-url">Tweet URL</Label>
            <div className="flex gap-2">
              <Input
                id="tweet-url"
                placeholder="https://x.com/user/status/123…"
                value={urlInput}
                onChange={(event) => setUrlInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void loadTweet();
                }}
              />
              <Button onClick={() => void loadTweet()} disabled={loading}>
                {loading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  "Load"
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Public posts only. Paste a full x.com or twitter.com status link.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Layout</p>
            <Select
              value={layout}
              onValueChange={(value) => setLayout(value as LayoutPreset)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (fit content)</SelectItem>
                <SelectItem value="square">Square 1:1 (1080×1080)</SelectItem>
                <SelectItem value="landscape">Landscape 16:9 (1920×1080)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Background</p>
            <div className="grid grid-cols-4 gap-2">
              {BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  title={preset.label}
                  onClick={() => setBackgroundId(preset.id)}
                  className={cn(
                    "aspect-square rounded-md border-2 transition-colors",
                    backgroundId === preset.id
                      ? "border-foreground"
                      : "border-transparent hover:border-border"
                  )}
                  style={preset.style}
                  aria-label={preset.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="padding">Padding</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {padding}px
              </span>
            </div>
            <Slider
              id="padding"
              min={16}
              max={120}
              step={4}
              value={[padding]}
              onValueChange={([value]) => setPadding(value)}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="scale">Tweet scale</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {scale}%
              </span>
            </div>
            <Slider
              id="scale"
              min={70}
              max={130}
              step={5}
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Theme</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="size-4" aria-hidden />
                Light
              </Button>
              <Button
                type="button"
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="size-4" aria-hidden />
                Dark
              </Button>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="rounded">Rounded corners</Label>
              <Switch
                id="rounded"
                checked={rounded}
                onCheckedChange={setRounded}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="shadow">Drop shadow</Label>
              <Switch id="shadow" checked={shadow} onCheckedChange={setShadow} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-metrics"
                checked={showMetrics}
                onCheckedChange={(checked) => setShowMetrics(checked === true)}
              />
              <Label htmlFor="show-metrics" className="font-normal">
                Show likes, replies, and reposts
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="hide-media"
                checked={hideMedia}
                onCheckedChange={(checked) => setHideMedia(checked === true)}
              />
              <Label htmlFor="hide-media" className="font-normal">
                Hide images and video
              </Label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              onClick={() => void exportImage()}
              disabled={!tweet || exporting}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Download className="size-4" aria-hidden />
              )}
              Download PNG
            </Button>
            <Button
              variant="outline"
              onClick={() => void copyImage()}
              disabled={!tweet || exporting}
            >
              <Copy className="size-4" aria-hidden />
              Copy image
            </Button>
          </div>
        </aside>

        <div className="p-5 sm:p-6 bg-muted/20 min-h-[420px] flex items-center justify-center overflow-auto">
          {!tweet ? (
            <div className="text-center space-y-3 max-w-sm text-muted-foreground">
              <ImageIcon className="size-10 mx-auto opacity-40" aria-hidden />
              <p className="text-sm">
                Paste a tweet URL and click Load to preview your screenshot here.
              </p>
            </div>
          ) : (
            <div
              ref={canvasRef}
              data-screenshot-canvas
              data-theme={theme}
              data-export-width={canvasSize?.width}
              data-export-height={canvasSize?.height}
              className={cn(
                "flex items-center justify-center overflow-hidden",
                layout !== "auto" && "mx-auto"
              )}
              style={{
                ...background.style,
                padding: `${padding}px`,
                width: canvasSize ? `${canvasSize.width / 2}px` : "auto",
                height: canvasSize ? `${canvasSize.height / 2}px` : "auto",
                minWidth: canvasSize ? `${canvasSize.width / 2}px` : undefined,
                minHeight: canvasSize ? `${canvasSize.height / 2}px` : undefined,
              }}
            >
              <div
                data-screenshot-tweet
                className={cn(
                  "w-full max-w-xl origin-center transition-transform",
                  !showMetrics &&
                    "[&_[class*='tweet-actions']]:hidden [&_[class*='tweet-replies']]:hidden",
                  hideMedia && "[&_[class*='tweet-media']]:hidden"
                )}
                style={{
                  transform: `scale(${scale / 100})`,
                  borderRadius: rounded ? "16px" : "0",
                  boxShadow: shadow
                    ? "0 25px 50px -12px rgba(0, 0, 0, 0.35)"
                    : "none",
                }}
              >
                <EmbeddedTweet
                  tweet={tweet}
                  components={tweetScreenshotComponents}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
