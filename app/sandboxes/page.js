import PublicSectionPage from "../../components/PublicSectionPage";
import { routeByPath, routeMetadata } from "../site";

const route = routeByPath("/sandboxes");

export const metadata = routeMetadata(route);

export default function SandboxesPage() {
  return (
    <PublicSectionPage
      title="Sandboxes"
      subtitle="Dynamic analysis handoff guidance after local static triage."
      sections={[
        {
          title: "When to Use a Sandbox",
          dot: "dot-orange",
          body: [
            "Static analysis can identify suspicious strings, IOCs, encoded payloads, and behavior patterns, but it cannot observe runtime behavior.",
            "Use an isolated sandbox or internal malware lab when authorized to validate process activity, network behavior, file writes, registry changes, persistence, and evasion.",
          ],
        },
        {
          title: "Manual Handoff Only",
          dot: "dot-blue",
          body: [
            "ThreatRecon.io does not upload samples, submit IOCs, detonate files, or call sandbox APIs automatically.",
            "External links are analyst-controlled pivots and should be used only when sharing the artifact is allowed.",
          ],
        },
        {
          title: "Sensitive Investigations",
          dot: "dot-yellow",
          body: [
            "Use private or internal sandboxing for sensitive client, company, regulated, or proprietary artifacts.",
          ],
        },
      ]}
    />
  );
}
