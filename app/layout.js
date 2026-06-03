import "./globals.css";

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

// The ThreatRecon engine ships as ES modules (import/export). They must load as
// module scripts so the existing files stay byte-for-byte identical — app.js
// imports utils.js / rules.js / md5.js itself. We render real <script type=
// "module"> tags (next/script with type="module" only emits preload links and
// never executes, which would break the tool). type="module" is the only
// addition required for browser loading under Next.js; no engine logic changed.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <script type="module" src="/assets/js/app.js" />
      </body>
    </html>
  );
}
