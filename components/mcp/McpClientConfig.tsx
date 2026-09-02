"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const KEY_PLACEHOLDER = "wkm_your_api_key";

function Snippet({
  code,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border bg-muted/50 p-4 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 h-7 bg-background"
        onClick={() => {
          navigator.clipboard.writeText(code).then(() => {
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
        {copied ? copiedLabel : copyLabel}
      </Button>
    </div>
  );
}

export default function McpClientConfig({ serverUrl }: { serverUrl: string }) {
  const t = useTranslations("Mcp.clients");

  const mcpServersJson = JSON.stringify(
    {
      mcpServers: {
        wakemark: {
          url: serverUrl,
          headers: { Authorization: `Bearer ${KEY_PLACEHOLDER}` },
        },
      },
    },
    null,
    2
  );

  const vscodeJson = JSON.stringify(
    {
      servers: {
        wakemark: {
          type: "http",
          url: serverUrl,
          headers: { Authorization: `Bearer ${KEY_PLACEHOLDER}` },
        },
      },
    },
    null,
    2
  );

  const claudeCodeCmd = `claude mcp add --transport http wakemark ${serverUrl} --header "Authorization: Bearer ${KEY_PLACEHOLDER}"`;

  return (
    <Tabs defaultValue="claude-desktop">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="claude-desktop">{t("claudeDesktop")}</TabsTrigger>
        <TabsTrigger value="claude-code">{t("claudeCode")}</TabsTrigger>
        <TabsTrigger value="cursor">{t("cursor")}</TabsTrigger>
        <TabsTrigger value="chatgpt">{t("chatgpt")}</TabsTrigger>
        <TabsTrigger value="vscode">{t("vscode")}</TabsTrigger>
      </TabsList>
      <TabsContent value="claude-desktop" className="mt-3">
        <Snippet
          code={mcpServersJson}
          copyLabel={t("copy")}
          copiedLabel={t("copied")}
        />
      </TabsContent>
      <TabsContent value="claude-code" className="mt-3 space-y-2">
        <p className="text-sm text-muted-foreground">{t("claudeCodeHint")}</p>
        <Snippet
          code={claudeCodeCmd}
          copyLabel={t("copy")}
          copiedLabel={t("copied")}
        />
      </TabsContent>
      <TabsContent value="cursor" className="mt-3">
        <Snippet
          code={mcpServersJson}
          copyLabel={t("copy")}
          copiedLabel={t("copied")}
        />
      </TabsContent>
      <TabsContent value="chatgpt" className="mt-3">
        <p className="text-sm text-muted-foreground">{t("chatgptSteps")}</p>
      </TabsContent>
      <TabsContent value="vscode" className="mt-3">
        <Snippet
          code={vscodeJson}
          copyLabel={t("copy")}
          copiedLabel={t("copied")}
        />
      </TabsContent>
    </Tabs>
  );
}
