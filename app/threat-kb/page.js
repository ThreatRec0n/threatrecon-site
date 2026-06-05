import PublicSectionPage from "../../components/PublicSectionPage";
import { routeByPath, routeMetadata } from "../site";
import { threatKbArticles } from "./articles";

const route = routeByPath("/threat-kb");

export const metadata = routeMetadata(route);

export default function ThreatKbPage() {
  return (
    <PublicSectionPage
      title="Threat KB"
      subtitle="Defensive malware triage notes for public threat research and SOC analyst training."
      sections={[
        {
          title: "Knowledge Base Scope",
          dot: "dot-blue",
          body: [
            "ThreatRecon.io Threat KB pages are educational and defensive summaries for static triage, detection engineering, and analyst workflow support.",
            "The analyzer does not attribute submitted artifacts to families or actors. Treat these notes as context for human review.",
          ],
        },
        {
          title: "Starter Writeups",
          dot: "dot-green",
          body: ["Each starter writeup includes behavior notes, MITRE ATT&CK mapping, IOC placeholders, detection opportunities, and defensive recommendations."],
          links: threatKbArticles.map(article => ({
            href: `/threat-kb/${article.slug}`,
            label: article.title,
          })),
        },
      ]}
    />
  );
}
