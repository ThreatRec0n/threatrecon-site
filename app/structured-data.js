import { SITE_URL, routeByPath } from "./site.js";

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ThreatRecon.io",
  url: `${SITE_URL}/`,
  description: "Browser based static malware triage and threat hunting training platform.",
};

const analyzerRoute = routeByPath("/analyzer");

export const analyzerStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ThreatRecon.io Analyzer",
  applicationCategory: "SecurityApplication",
  operatingSystem: "Web browser",
  url: `${SITE_URL}/analyzer`,
  description: analyzerRoute.description,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export function threatKbArticleStructuredData(article) {
  const url = `${SITE_URL}/threat-kb/${article.slug}`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.summary,
      mainEntityOfPage: url,
      articleSection: "Threat KB",
      about: article.malwareType,
      dateModified: "2026-06-04",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${SITE_URL}/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Threat KB",
          item: `${SITE_URL}/threat-kb`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: article.title,
          item: url,
        },
      ],
    },
  ];
}
