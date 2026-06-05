import LegalPageLayout from "../../components/LegalPageLayout";
import { routeByPath, routeMetadata } from "../site";

const route = routeByPath("/legal");

export const metadata = routeMetadata(route);

export default function LegalPage() {
  return (
    <LegalPageLayout
      title="Legal & Responsible Use"
      subtitle="ThreatRecon is a browser-based static malware triage workbench. These terms describe how the site may be used and the limits of what it provides."
    >
      <div className="panel">
        <div className="panel-head"><div className="dot dot-green"></div>Educational and defensive use</div>
        <div className="panel-body">
          <p>ThreatRecon.io is built for defensive security education, malware triage practice, and analyst workflow training. Users are responsible for using the platform legally and ethically.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>Static-analysis limitation</div>
        <div className="panel-body">
          <p>ThreatRecon performs <strong>local static analysis only</strong>. It does not execute samples, detonate malware, upload files, or guarantee detection of malicious behavior.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-orange"></div>Authorization requirement</div>
        <div className="panel-body">
          <p>You are responsible for ensuring you have authorization to analyze files, logs, IOCs, or systems associated with any investigation.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-red"></div>Sensitive data warning</div>
        <div className="panel-body">
          <p>Do not paste or upload sensitive, proprietary, regulated, classified, credential-bearing, or personally identifiable data unless you are authorized and understand the risk. Analysis runs locally in your browser, but exported reports may still contain sensitive indicators.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>Public sandbox warning</div>
        <div className="panel-body">
          <p>External sandbox links are <strong>manual handoff links only</strong>. ThreatRecon does not submit files or IOCs to third parties. Do not submit confidential client files, proprietary samples, or regulated data to public sandboxes unless authorized. Use private or internal sandboxing for sensitive investigations.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-yellow"></div>No warranty</div>
        <div className="panel-body">
          <p>ThreatRecon is provided <em>as-is</em>, without warranties of accuracy, availability, fitness for a particular purpose, or complete security.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-red"></div>Limitation of liability</div>
        <div className="panel-body">
          <p>To the maximum extent allowed by applicable law, the site operator is not liable for damages, data loss, operational disruption, misuse, or decisions made based on tool output.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-red"></div>Acceptable use</div>
        <div className="panel-body">
          <p>You must not use ThreatRecon to:</p>
          <ul>
            <li>create or improve malware or evasion techniques;</li>
            <li>attack third-party systems without authorization;</li>
            <li>violate applicable laws or regulations;</li>
            <li>analyze data you are not authorized to handle;</li>
            <li>harass or target individuals;</li>
            <li>bypass security controls without authorization.</li>
          </ul>
        </div>
      </div>
    </LegalPageLayout>
  );
}
