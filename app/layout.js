import "./globals.css";
import VercelTelemetry from "./components/VercelTelemetry";

const siteUrl = "https://www.threatrecon.io";
const siteTitle = "ThreatRecon.io | Browser Based Malware Triage and Threat Hunting Lab";
const siteDescription =
  "Analyze suspicious files locally in your browser with IOC extraction, strings analysis, entropy checks, MITRE ATT&CK mapping, YARA style drafts, Sigma style drafts, and analyst reporting.";
const ogDescription =
  "Browser based static malware triage, IOC extraction, MITRE ATT&CK mapping, YARA style drafts, Sigma style drafts, and analyst reporting without sample uploads.";
const twitterDescription =
  "Analyze suspicious files locally in your browser with static malware triage, IOC extraction, MITRE ATT&CK mapping, YARA style drafts, Sigma style drafts, and analyst reporting.";
const ogImage = "/og-threatrecon.svg";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | ThreatRecon.io",
  },
  description: siteDescription,
  keywords: [
    "malware triage",
    "static malware analysis",
    "IOC extraction",
    "MITRE ATT&CK",
    "YARA rule generator",
    "Sigma rule generator",
    "detection engineering",
    "SOC analyst tools",
    "reverse engineering support",
    "browser based malware analysis",
    "threat hunting",
    "PowerShell analysis",
    "malware report generator",
  ],
  applicationName: "ThreatRecon.io",
  publisher: "ThreatRecon.io",
  category: "SecurityApplication",
  referrer: "no-referrer",
  icons: { icon: "/favicon.svg" },
  alternates: {
    canonical: `${siteUrl}/`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}/`,
    siteName: "ThreatRecon.io",
    title: siteTitle,
    description: ogDescription,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "ThreatRecon.io browser based malware triage workbench preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: twitterDescription,
    images: [ogImage],
  },
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
