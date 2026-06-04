import "./globals.css";
import VercelTelemetry from "./components/VercelTelemetry";

const siteUrl = "https://threatrecon.io";
const siteTitle = "ThreatRecon.io | Browser Based Malware Triage Workbench";
const siteDescription =
  "ThreatRecon.io is a browser based static malware triage workbench for IOC extraction, MITRE ATT&CK mapping, deobfuscation, YARA and Sigma rule generation, detection engineering, and analyst reporting. Files are analyzed locally in the browser and are not uploaded or executed.";
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
    "cybersecurity portfolio",
    "threat hunting",
    "PowerShell analysis",
    "malware report generator",
  ],
  applicationName: "ThreatRecon.io",
  creator: "Andre Boone",
  publisher: "ThreatRecon.io",
  category: "SecurityApplication",
  referrer: "no-referrer",
  icons: { icon: "/favicon.svg" },
  alternates: {
    canonical: siteUrl,
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
    url: siteUrl,
    siteName: "ThreatRecon.io",
    title: siteTitle,
    description: siteDescription,
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
    description: siteDescription,
    images: [ogImage],
  },
};

export const viewport = {
  themeColor: "#0a0c0f",
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ThreatRecon.io",
    applicationCategory: "SecurityApplication",
    operatingSystem: "Web browser",
    description: siteDescription,
    url: siteUrl,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    creator: {
      "@type": "Person",
      name: "Andre Boone",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ThreatRecon.io",
    url: siteUrl,
    description: siteDescription,
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
        <VercelTelemetry />
        <script type="module" src="/assets/js/vercel-telemetry.js" />
      </body>
    </html>
  );
}
