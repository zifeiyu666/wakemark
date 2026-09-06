import McpClientConfig from "@/components/mcp/McpClientConfig";
import { Badge } from "@/components/ui/badge";
import { Link as I18nLink } from "@/i18n/routing";
import { Locale } from "@/i18n/routing";
import { constructMetadata } from "@/lib/metadata";
import { mcpServerUrl } from "@/lib/mcp/server";
import { MCP_TOOL_DOCS } from "@/lib/mcp/tools";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Params = Promise<{ locale: string }>;

type MetadataProps = {
  params: Params;
};

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "McpDocs" });

  return constructMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    path: `/docs/mcp`,
  });
}

export default async function McpDocsPage() {
  const t = await getTranslations("McpDocs");
  const serverUrl = mcpServerUrl();

  return (
    <div className="w-full border-b">
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        {/* Hero */}
        <header className="mb-12 space-y-3">
          <Badge variant="secondary">{t("hero.eyebrow")}</Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="text-muted-foreground">{t("hero.subtitle")}</p>
        </header>

        <div className="space-y-12 text-[15px] leading-relaxed">
          {/* Overview */}
          <section id="overview" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("overview.title")}
            </h2>
            <p>{t("overview.p1")}</p>
            <ul className="space-y-2 rounded-md border bg-muted/40 p-4">
              <li>
                <span className="font-medium">
                  {t("overview.points.endpoint")}:
                </span>{" "}
                <code className="font-mono text-sm">{serverUrl}</code>
              </li>
              <li>{t("overview.points.transport")}</li>
              <li>{t("overview.points.auth")}</li>
              <li>{t("overview.points.scope")}</li>
            </ul>
          </section>

          {/* Quickstart */}
          <section id="quickstart" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("quickstart.title")}
            </h2>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  1
                </span>
                <div>
                  <p className="font-medium">{t("quickstart.step1Title")}</p>
                  <p className="text-muted-foreground">
                    {t("quickstart.step1Body")}{" "}
                    <I18nLink
                      href="/dashboard/mcp"
                      className="font-medium text-foreground underline underline-offset-4"
                    >
                      {t("quickstart.step1Link")}
                    </I18nLink>
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  2
                </span>
                <div>
                  <p className="font-medium">{t("quickstart.step2Title")}</p>
                  <p className="text-muted-foreground">
                    {t("quickstart.step2Body")}
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  3
                </span>
                <div>
                  <p className="font-medium">{t("quickstart.step3Title")}</p>
                  <p className="text-muted-foreground">
                    {t("quickstart.step3Body")}
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Installation by client */}
          <section id="clients" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("clients.title")}
            </h2>

            <div className="space-y-2">
              <h3 className="font-semibold">{t("clients.claudeDesktopTitle")}</h3>
              <p className="text-muted-foreground">
                {t("clients.claudeDesktopBody")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("clients.claudeCodeTitle")}</h3>
              <p className="text-muted-foreground">{t("clients.claudeCodeBody")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("clients.cursorTitle")}</h3>
              <p className="text-muted-foreground">{t("clients.cursorBody")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("clients.vscodeTitle")}</h3>
              <p className="text-muted-foreground">{t("clients.vscodeBody")}</p>
            </div>

            <McpClientConfig serverUrl={serverUrl} />

            <div className="space-y-2">
              <h3 className="font-semibold">{t("clients.chatgptTitle")}</h3>
              <p className="text-muted-foreground">{t("clients.chatgptBody")}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">{t("clients.otherTitle")}</h3>
              <p className="text-muted-foreground">{t("clients.otherBody")}</p>
            </div>
          </section>

          {/* Tool reference */}
          <section id="tools" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("tools.title")}
            </h2>
            <p>{t("tools.intro")}</p>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-2 font-medium">
                      {t("tools.colName")}
                    </th>
                    <th className="px-4 py-2 font-medium">
                      {t("tools.colDescription")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MCP_TOOL_DOCS.map((tool) => (
                    <tr key={tool.name} className="border-b last:border-b-0">
                      <td className="px-4 py-2 align-top">
                        <code className="font-mono text-xs">{tool.name}</code>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {tool.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Rate limits */}
          <section id="limits" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("limits.title")}
            </h2>
            <p>{t("limits.body")}</p>
          </section>

          {/* Security */}
          <section id="security" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("security.title")}
            </h2>
            <p>{t("security.p1")}</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>{t("security.points.revoke")}</li>
              <li>{t("security.points.expiry")}</li>
              <li>{t("security.points.storage")}</li>
            </ul>
          </section>

          {/* FAQ */}
          <section id="faq" className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("faq.title")}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">{t("faq.q1")}</p>
                <p className="text-muted-foreground">{t("faq.a1")}</p>
              </div>
              <div>
                <p className="font-medium">{t("faq.q2")}</p>
                <p className="text-muted-foreground">{t("faq.a2")}</p>
              </div>
              <div>
                <p className="font-medium">{t("faq.q3")}</p>
                <p className="text-muted-foreground">{t("faq.a3")}</p>
                <pre className="mt-2 overflow-x-auto rounded-md border bg-muted/50 p-3 text-xs">
                  <code>npx @modelcontextprotocol/inspector</code>
                </pre>
              </div>
              <div>
                <p className="font-medium">{t("faq.q4")}</p>
                <p className="text-muted-foreground">{t("faq.a4")}</p>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  );
}
