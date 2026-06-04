export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.threatrecon.io/sitemap.xml",
  };
}
