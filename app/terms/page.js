import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "ThreatRecon Terms of Use",
  description: "Terms of use for ThreatRecon.io browser based static malware triage and analyst workflow support.",
  alternates: {
    canonical: "https://threatrecon.io/terms",
  },
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms of Use"
      subtitle="By using ThreatRecon.io you agree to these terms."
    >
      <div className="panel">
        <div className="panel-body">
          <ul>
            <li><strong>Defensive use only.</strong> ThreatRecon is for authorized defensive security, research, and triage.</li>
            <li><strong>Authorization.</strong> You must have permission to analyze the data you submit.</li>
            <li><strong>No illegal activity.</strong> You may not use the site to violate law or policy.</li>
            <li><strong>No warranties.</strong> The site is provided as-is without guaranteed malware detection or security.</li>
            <li><strong>Informational reports.</strong> Output is not professional, legal, or forensic certification.</li>
            <li><strong>Third-party links.</strong> External services are independent; you are responsible for sandbox submissions and their policies.</li>
            <li><strong>Your risk.</strong> You use ThreatRecon at your own risk and remain responsible for operational decisions.</li>
          </ul>
          <p>See also <a href="/legal">Legal &amp; Responsible Use</a> and <a href="/privacy">Privacy</a>.</p>
        </div>
      </div>
    </LegalPageLayout>
  );
}
