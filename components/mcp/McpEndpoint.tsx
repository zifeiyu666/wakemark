"use client";

import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function McpEndpoint({ url }: { url: string }) {
  const t = useTranslations("Mcp.endpoint");
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
      <code className="flex-1 truncate font-mono text-sm">{url}</code>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 bg-background"
        onClick={() => {
          navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }}
      >
        {copied ? (
          <Check className="size-3.5 mr-1.5" />
        ) : (
          <Copy className="size-3.5 mr-1.5" />
        )}
        {copied ? t("copied") : t("copy")}
      </Button>
    </div>
  );
}
