import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "Security",
  description:
    "ThreatRecon.io security model, local file analysis design, no account requirement, responsible use, and known limitations.",
  alternates: {
    canonical: "https://www.threatrecon.io/security",
  },
};

export default function SecurityPage() {
  return (
    <LegalPageLayout
      title="Security Model"
      subtitle="Current security model for ThreatRecon.io browser based static analysis."
    >
      <div className="panel">
        <div className="panel-head"><div className="dot dot-green"></div>Security Model</div>
        <div className="panel-body">
          <p>ThreatRecon.io is a browser based static analysis and analyst training platform. The current design reduces exposure by avoiding server side sample upload workflows.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>Local File Analysis</div>
        <div className="panel-body">
          <p>Files are processed locally in the browser during local analysis workflows. ThreatRecon.io does not intentionally collect submitted samples and does not provide server side malware sample storage.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-purple"></div>No Account Requirement</div>
        <div className="panel-body">
          <p>The site does not require user accounts. The site does not require login.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-orange"></div>Responsible Use</div>
        <div className="panel-body">
          <p>Users should only analyze files they are authorized to inspect. ThreatRecon.io is intended for defensive security education, malware triage practice, and analyst workflow training.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-yellow"></div>Limitations</div>
        <div className="panel-body">
          <p>ThreatRecon.io provides static analysis assistance and analyst training workflows. Static analysis results should be reviewed by a human analyst and should not be treated as a complete malware verdict by themselves.</p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
