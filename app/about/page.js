import LegalPageLayout from "../../components/LegalPageLayout";
import { routeByPath, routeMetadata } from "../site";

const route = routeByPath("/about");

export const metadata = routeMetadata(route);

export default function AboutPage() {
  return (
    <LegalPageLayout
      title="About ThreatRecon.io"
      subtitle="An advanced browser based static malware triage, detection engineering, and reverse engineering support workbench."
    >
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>Purpose</div>
        <div className="panel-body">
          <p>ThreatRecon.io helps analysts perform malware triage, IOC extraction, MITRE ATT&amp;CK mapping, deobfuscation, YARA and Sigma draft generation, detection engineering, and analyst reporting in the browser.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-green"></div>Safety model</div>
        <div className="panel-body">
          <p>Analysis is local and static. ThreatRecon.io does not upload samples, execute files, detonate malware, or automatically submit artifacts to third party services.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-purple"></div>Creator</div>
        <div className="panel-body">
          <p>ThreatRecon.io was built by Andre Boone.</p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
