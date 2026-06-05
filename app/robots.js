import { SITE_URL } from "./site";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/private/",
          "/debug/",
          "/dev/",
          "/test/",
          "/internal/",
          "/staging/",
          "/preview/",
          "/drafts/",
          "/*.map$",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
