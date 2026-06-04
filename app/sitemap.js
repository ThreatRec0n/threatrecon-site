const baseUrl = "https://www.threatrecon.io";
const lastModified = new Date("2026-06-04");

export default function sitemap() {
  return [
    {
      url: `${baseUrl}/`,
      lastModified,
      changeFrequency: "weekly",
    },
    {
      url: `${baseUrl}/security`,
      lastModified,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "monthly",
    },
    {
      url: `${baseUrl}/legal`,
      lastModified,
      changeFrequency: "monthly",
    },
  ];
}
