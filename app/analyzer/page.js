import PublicSectionPage from "../../components/PublicSectionPage";
import StructuredData from "../../components/StructuredData";
import { analyzerStructuredData } from "../structured-data";
import { routeByPath, routeMetadata } from "../site";

const route = routeByPath("/analyzer");

export const metadata = routeMetadata(route);

export default function AnalyzerPage() {
  return (
    <>
      <StructuredData data={analyzerStructuredData} />
      <PublicSectionPage
        title="Analyzer"
        subtitle="Browser based static malware triage, IOC extraction, ATT&CK mapping, and analyst reporting."
        cta={{
          title: "Open the interactive analyzer",
          description:
            "The full analyzer runs locally in the browser on the homepage. Files are processed locally and are not uploaded to ThreatRecon.io.",
          href: "/#analyzer",
          label: "Open the browser analyzer",
        }}
        sections={[
          {
            title: "Local File Analysis",
            dot: "dot-green",
            body: [
              "ThreatRecon.io supports static malware triage workflows for suspicious scripts, logs, text artifacts, IOCs, and PE-like files within browser safety limits.",
              "Hashing, strings review, entropy checks, suspicious API review, IOC extraction, and report generation happen in the browser.",
            ],
          },
          {
            title: "Detection Output",
            dot: "dot-blue",
            body: [
              "The analyzer generates draft YARA and Sigma style output, Splunk and Defender KQL hunting ideas, IOC exports, blocklists, and analyst reports for review.",
              "Generated output is a starting point for defensive validation and should be reviewed before operational use.",
            ],
          },
          {
            title: "Safety Boundary",
            dot: "dot-yellow",
            body: [
              "ThreatRecon.io does not execute files, detonate malware, upload samples, or submit artifacts to external malware-analysis APIs automatically.",
            ],
          },
        ]}
      />
    </>
  );
}
