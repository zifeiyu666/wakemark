import { siteConfig } from "@/config/site";
import {
  FAQS,
  PAGE_DESCRIPTION,
  PAGE_PATH,
  PAGE_TITLE,
} from "@/lib/alternatives/tweetstorm-content";

export function tweetstormAlternativeJsonLd() {
  const url = `${siteConfig.url}${PAGE_PATH}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        isPartOf: {
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
        },
        primaryImageOfPage: `${siteConfig.url}/og.png`,
        dateModified: "2026-09-10",
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
            name: "TweetStorm alternative",
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
