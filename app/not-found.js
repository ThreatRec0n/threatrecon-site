export const metadata = {
  title: "404 | ThreatRecon.io",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="legal-page">
      <div className="panel">
        <div className="panel-head"><div className="dot dot-red"></div>ThreatRecon.io</div>
        <div className="panel-body">
          <h1 className="page-title">404: IOC not found. Neither were the secrets.</h1>
          <p className="page-sub">Static site. Browser-only analysis. No upload backend, no login, and no server-side malware handling.</p>
          <p><a href="/">Return to the analyzer</a></p>
        </div>
      </div>
    </main>
  );
}
