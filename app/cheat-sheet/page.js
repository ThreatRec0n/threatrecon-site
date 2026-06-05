import PublicSectionPage from "../../components/PublicSectionPage";
import { routeByPath, routeMetadata } from "../site";

const route = routeByPath("/cheat-sheet");

export const metadata = routeMetadata(route);

export default function CheatSheetPage() {
  return (
    <PublicSectionPage
      title="Cheat Sheet"
      subtitle="Analyst reminders for static malware triage, IOC review, and detection engineering."
      sections={[
        {
          title: "First Pass Triage",
          dot: "dot-green",
          body: [
            "Start with file type, hashes, strings, entropy, imports, sections, suspicious APIs, and obvious IOCs.",
            "Record what is directly observed before assigning confidence or making a malware-family claim.",
          ],
        },
        {
          title: "IOC Handling",
          dot: "dot-blue",
          body: [
            "Separate public IPs, domains, URLs, hashes, file paths, registry paths, and email indicators by actionability.",
            "Use manual pivots for reputation checks and avoid submitting sensitive artifacts unless authorized.",
          ],
        },
        {
          title: "Detection Review",
          dot: "dot-purple",
          body: [
            "Treat generated YARA, Sigma, Splunk, Defender KQL, Elastic, and blocklist output as drafts.",
            "Tune detections against known-good data and validate behavior with approved dynamic analysis when needed.",
          ],
        },
      ]}
    />
  );
}
