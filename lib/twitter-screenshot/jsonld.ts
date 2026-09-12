import { siteConfig } from "@/config/site";
import { FAQS, PAGE_DESCRIPTION, PAGE_PATH, PAGE_TITLE } from "./content";

export function twitterScreenshotJsonLd() {
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
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}#software`,
        name: "Twitter Screenshot Generator",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        url,
        description: PAGE_DESCRIPTION,
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
          "Load tweets by URL",
          "Gradient and solid backgrounds",
          "Instagram and YouTube canvas presets",
          "Light and dark tweet themes",
          "Adjustable padding and scale",
          "Show or hide engagement metrics",
          "Download PNG",
          "Copy image to clipboard",
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
            name: "Twitter Screenshot Generator",
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
