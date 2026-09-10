import { siteConfig } from "@/config/site";
import { FAQS } from "@/lib/twitter-search/content";

const PAGE_PATH = "/tools/twitter-advanced-search";

export function twitterAdvancedSearchJsonLd() {
  const url = `${siteConfig.url}${PAGE_PATH}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: "Advanced Twitter Search: Free X Tool, No Account",
        description:
          "Build an advanced Twitter search for X without memorizing operators. Filter tweets by date, account, likes, media, and language. Free, no WakeMark signup.",
        isPartOf: {
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        primaryImageOfPage: `${siteConfig.url}/og.png`,
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#software`,
        name: "Advanced Twitter Search",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        url,
        description:
          "A free advanced search builder for X (Twitter). Fill in form fields for words, accounts, engagement, dates, media, location and verification. It writes the X search query and opens the results on X.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        provider: {
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        featureList: [
          "Match all words, exact phrase, any words, or exclude terms",
          "Hashtag search",
          "70+ language filters",
          "Search posts from, to, or mentioning an account",
          "Minimum likes, replies and reposts",
          "Filter by post type: original, reply, repost or quote",
          "Filter by images, video or GIFs",
          "Include, require or exclude posts with links",
          "Twitter search by date",
          "Location and distance search",
          "Target posts linking a specific domain",
          "Verified accounts only",
          "Live query preview",
          "Recent searches in this browser",
        ],
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteConfig.url,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Advanced Twitter Search",
            item: url,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };
}
