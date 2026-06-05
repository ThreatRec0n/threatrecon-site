import PublicSectionPage from "../../components/PublicSectionPage";
import { routeByPath, routeMetadata } from "../site";

const route = routeByPath("/re-tools");

export const metadata = routeMetadata(route);

export default function ReToolsPage() {
  return (
    <PublicSectionPage
      title="RE Tools"
      subtitle="Free reverse engineering tool references for authorized malware analysis workflows."
      sections={[
        {
          title: "Static Analysis Tools",
          dot: "dot-blue",
          body: [
            "Use static analysis tools to inspect PE structure, imports, strings, resources, entropy, and suspicious code paths without executing the artifact.",
            "ThreatRecon.io references common free tools and keeps tool usage as analyst guidance, not automatic execution.",
          ],
        },
        {
          title: "String and Encoding Review",
          dot: "dot-green",
          body: [
            "Strings, encoded blobs, URLs, registry paths, mutexes, and command fragments can help guide reverse engineering preparation.",
            "Decoded content should be treated as inert evidence and reviewed in an isolated analysis workflow.",
          ],
        },
        {
          title: "Workflow Boundary",
          dot: "dot-yellow",
          body: [
            "ThreatRecon.io does not provide debugger integration, live detonation, or server-side malware handling. Use dedicated lab systems for deeper reverse engineering.",
          ],
        },
      ]}
    />
  );
}
