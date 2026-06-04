import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "ThreatRecon Privacy Policy | Local Static Analysis and No Sample Upload",
  description: "Privacy practices for ThreatRecon.io local static analysis, browser based malware triage, Vercel telemetry, and no sample upload.",
  alternates: {
    canonical: "https://threatrecon.io/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy"
      subtitle="How ThreatRecon handles data in the browser and on hosting infrastructure."
    >
      <div className="panel">
        <div className="panel-head"><div className="dot dot-green"></div>Browser-only analysis</div>
        <div className="panel-body">
          <ul>
            <li>ThreatRecon does not upload samples by default.</li>
            <li>ThreatRecon does not make malware-analysis API calls by default. Network access is limited to site telemetry and user-initiated external links.</li>
            <li>ThreatRecon does not intentionally collect pasted samples, uploaded files, decoded payloads, or generated reports.</li>
            <li>Analysis occurs locally in your browser.</li>
            <li>Exported reports are saved by you locally when you choose to download or copy them.</li>
          </ul>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>External links</div>
        <div className="panel-body">
          <p>External sandbox and reputation links take you away from ThreatRecon. Those sites have their own privacy policies. ThreatRecon does not control third-party data handling.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-yellow"></div>Hosting logs</div>
        <div className="panel-body">
          <p>ThreatRecon does not intentionally collect analysis content. Standard hosting infrastructure (for example Vercel) may process access logs, IP addresses, user agents, timestamps, and request metadata as part of normal web hosting.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>Vercel Analytics</div>
        <div className="panel-body">
          <p>ThreatRecon uses Vercel Web Analytics and Speed Insights for anonymized site usage and performance metrics. ThreatRecon does not collect pasted samples, uploaded local file contents, decoded payloads, reports, or malware analysis content.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-green"></div>What we do not do</div>
        <div className="panel-body">
          <ul>
            <li>ThreatRecon does not sell user data.</li>
            <li>ThreatRecon does not use advertising trackers.</li>
            <li>ThreatRecon does not use Google Analytics, ad trackers, or marketing pixels.</li>
          </ul>
          <p>If optional server-side enrichment is ever enabled, this privacy page will be updated before that feature is turned on.</p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
