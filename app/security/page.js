import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "ThreatRecon Security Model | Local Browser Based Malware Analysis",
  description:
    "Security model for ThreatRecon.io browser based static malware triage, local analysis, no sample upload, and manual external pivots.",
  alternates: {
    canonical: "https://threatrecon.io/security",
  },
};

export default function SecurityPage() {
  return (
    <LegalPageLayout
      title="Security Model"
      subtitle="How ThreatRecon.io keeps malware triage local, static, and privacy conscious."
    >
      <div className="panel">
        <div className="panel-head"><div className="dot dot-green"></div>Local static analysis</div>
        <div className="panel-body">
          <p>ThreatRecon.io performs browser based static analysis for suspicious scripts, logs, IOCs, command lines, and text artifacts. Files are not uploaded to ThreatRecon.io and are not executed.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>Network boundaries</div>
        <div className="panel-body">
          <p>ThreatRecon.io does not add malware-analysis API calls. External sandbox and reputation links are manual analyst pivots only. Site telemetry is limited to Vercel Web Analytics and Speed Insights for usage and performance metrics.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-yellow"></div>What ThreatRecon is not</div>
        <div className="panel-body">
          <p>ThreatRecon.io is not a sandbox, malware detonation platform, debugger, full disassembler, unpacker, emulator, or live threat intelligence platform.</p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
