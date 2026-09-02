import { listMcpApiKeys, type ApiKeyRow } from "@/actions/mcp/keys";
import McpClientConfig from "@/components/mcp/McpClientConfig";
import McpEndpoint from "@/components/mcp/McpEndpoint";
import McpKeyManager from "@/components/mcp/McpKeyManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link as I18nLink } from "@/i18n/routing";
import { getSession } from "@/lib/auth/server";
import { constructMetadata } from "@/lib/metadata";
import { mcpServerUrl } from "@/lib/mcp/server";
import { MCP_TOOL_DOCS } from "@/lib/mcp/tools";
import { ArrowUpRight } from "lucide-react";
import { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Mcp" });

  return constructMetadata({
    page: "MCP",
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/dashboard/mcp`,
  });
}

export default async function McpPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const t = await getTranslations("Mcp");
  const keysResult = await listMcpApiKeys();
  const keys: ApiKeyRow[] = keysResult.success ? (keysResult.data ?? []) : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="pt-6">
          <CardTitle className="text-lg">{t("endpoint.title")}</CardTitle>
          <CardDescription>{t("endpoint.description")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <McpEndpoint url={mcpServerUrl()} />
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="pt-6">
          <CardTitle className="text-lg">{t("keys.title")}</CardTitle>
          <CardDescription>{t("keys.description")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <McpKeyManager initialKeys={keys} />
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="pt-6">
          <CardTitle className="text-lg">{t("clients.title")}</CardTitle>
          <CardDescription>{t("clients.description")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <McpClientConfig serverUrl={mcpServerUrl()} />
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="pt-6">
          <CardTitle className="text-lg">{t("tools.title")}</CardTitle>
          <CardDescription>{t("tools.description")}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-6">
          <ul className="space-y-3">
            {MCP_TOOL_DOCS.map((tool) => (
              <li key={tool.name} className="flex flex-col gap-0.5">
                <code className="font-mono text-sm font-medium">
                  {tool.name}
                </code>
                <span className="text-sm text-muted-foreground">
                  {tool.description}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {t("docsHint")}{" "}
        <I18nLink
          href="/docs/mcp"
          className="inline-flex items-center gap-0.5 font-medium text-foreground underline underline-offset-4"
        >
          {t("docsLink")}
          <ArrowUpRight className="size-3.5" />
        </I18nLink>
      </p>
    </div>
  );
}
