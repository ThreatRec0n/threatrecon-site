import { SITE_URL, publicRoutes } from "./site";
import { threatKbArticles } from "./threat-kb/articles";

const lastModified = new Date();

export default function sitemap() {
  const articleRoutes = threatKbArticles.map(article => ({
    path: `/threat-kb/${article.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...publicRoutes, ...articleRoutes].map(route => ({
    url: `${SITE_URL}${route.path === "/" ? "/" : route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
