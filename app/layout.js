import "./globals.css";
import VercelTelemetry from "./components/VercelTelemetry";

export const metadata = {
  title: "ThreatRecon Malware Triage Workbench",
  description:
    "Browser-based static malware triage, IOC extraction, YARA-style local regex rules, deobfuscation, MITRE ATT&CK mapping, and local analyst reporting.",
  referrer: "no-referrer",
  icons: { icon: "/favicon.svg" },
};

export const viewport = {
  themeColor: "#0a0c0f",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <VercelTelemetry />
        <script type="module" src="/assets/js/vercel-telemetry.js" />
      </body>
    </html>
  );
}
