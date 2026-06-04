import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-about">
          <div className="footer-brand">ThreatRecon.io</div>
          <div className="footer-meta">
            Browser-only static malware triage &middot; No sample upload &middot; No API calls by default
          </div>
        </div>
        <div className="footer-links">
          <Link href="/">Home</Link>
          <Link href="/#analyzer">Analyzer</Link>
          <Link href="/#security">Security</Link>
          <Link href="/legal">Legal</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
