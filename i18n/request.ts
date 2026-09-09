import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  const common = (await import(`./messages/${locale}/common.json`)).default;

  return {
    locale,
    messages: {
      Landing: (await import(`./messages/${locale}/Landing.json`)).default,
      Pricing: (await import(`./messages/${locale}/Pricing.json`)).default,
      NotFound: (await import(`./messages/${locale}/NotFound.json`)).default,
      Glossary: (await import(`./messages/${locale}/Glossary.json`)).default,
      Docs: (await import(`./messages/${locale}/Docs.json`)).default,
      McpDocs: (await import(`./messages/${locale}/McpDocs.json`)).default,
      ExtensionDocs: (await import(`./messages/${locale}/ExtensionDocs.json`)).default,
      RaycastDocs: (await import(`./messages/${locale}/RaycastDocs.json`)).default,
      IntroductionDocs: (await import(`./messages/${locale}/IntroductionDocs.json`)).default,
      QuickstartDocs: (await import(`./messages/${locale}/QuickstartDocs.json`)).default,
      ImportHistoryDocs: (await import(`./messages/${locale}/ImportHistoryDocs.json`)).default,
      ExportDocs: (await import(`./messages/${locale}/ExportDocs.json`)).default,
      NotionDocs: (await import(`./messages/${locale}/NotionDocs.json`)).default,
      Roadmap: (await import(`./messages/${locale}/Roadmap.json`)).default,

      // Dashboard - User
      Settings: (await import(`./messages/${locale}/Dashboard/User/Settings.json`)).default,
      CreditHistory: (await import(`./messages/${locale}/Dashboard/User/CreditHistory.json`)).default,
      Bookmarks: (await import(`./messages/${locale}/Dashboard/User/Bookmarks.json`)).default,
      Digests: (await import(`./messages/${locale}/Dashboard/User/Digests.json`)).default,
      Lists: (await import(`./messages/${locale}/Dashboard/User/Lists.json`)).default,
      AskAi: (await import(`./messages/${locale}/Dashboard/User/AskAi.json`)).default,
      Onboarding: (await import(`./messages/${locale}/Dashboard/User/Onboarding.json`)).default,
      EmailPrompt: (await import(`./messages/${locale}/Dashboard/User/EmailPrompt.json`)).default,
      Mcp: (await import(`./messages/${locale}/Dashboard/User/Mcp.json`)).default,

      // Dashboard - Admin
      Overview: (await import(`./messages/${locale}/Dashboard/Admin/Overview.json`)).default,
      Users: (await import(`./messages/${locale}/Dashboard/Admin/Users.json`)).default,
      DashboardBlogs: (await import(`./messages/${locale}/Dashboard/Admin/Blogs.json`)).default,
      DashboardGlossary: (await import(`./messages/${locale}/Dashboard/Admin/Glossary.json`)).default,
      Orders: (await import(`./messages/${locale}/Dashboard/Admin/Orders.json`)).default,
      Feedback: (await import(`./messages/${locale}/Dashboard/Admin/Feedback.json`)).default,
      R2Files: (await import(`./messages/${locale}/Dashboard/Admin/R2Files.json`)).default,
      Prices: (await import(`./messages/${locale}/Dashboard/Admin/Prices.json`)).default,

      // common
      ...common
    }
  };
});