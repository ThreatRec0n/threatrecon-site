import LegalPageLayout from "../../components/LegalPageLayout";
import { routeByPath, routeMetadata } from "../site";

const route = routeByPath("/privacy");

export const metadata = routeMetadata(route);

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy"
      subtitle="How ThreatRecon.io handles local analysis and site telemetry."
    >
      <div className="panel">
        <div className="panel-head"><div className="dot dot-green"></div>Local analysis</div>
        <div className="panel-body">
          <ul>
            <li>ThreatRecon.io is designed for browser based static analysis.</li>
            <li>Files are not uploaded to ThreatRecon.io during local analysis workflows.</li>
            <li>The platform does not require accounts.</li>
            <li>The platform does not require login.</li>
            <li>The platform does not collect submitted samples.</li>
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
          <p>Standard hosting infrastructure may process access logs, IP addresses, user agents, timestamps, and request metadata as part of normal web hosting.</p>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><div className="dot dot-blue"></div>Vercel Analytics</div>
        <div className="panel-body">
          <p>ThreatRecon.io uses Vercel Web Analytics and Speed Insights for site usage and performance metrics. These telemetry tools are not used to collect submitted samples, decoded payloads, or generated reports.</p>
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
        </div>
      </div>
    </LegalPageLayout>
  );
}
