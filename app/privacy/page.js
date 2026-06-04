import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "Privacy — ThreatRecon",
  description: "Privacy practices for ThreatRecon.io — browser-only static malware triage.",
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
            <li>ThreatRecon does not make API calls by default (<code>connect-src &apos;none&apos;</code>).</li>
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
        <div className="panel-head"><div className="dot dot-green"></div>What we do not do</div>
        <div className="panel-body">
          <ul>
            <li>ThreatRecon does not sell user data.</li>
            <li>ThreatRecon does not use advertising trackers.</li>
            <li>ThreatRecon does not use analytics unless explicitly disclosed and enabled in the future.</li>
          </ul>
          <p>If optional server-side enrichment is ever enabled, this privacy page will be updated before that feature is turned on.</p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
