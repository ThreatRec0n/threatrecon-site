import Link from "next/link";
import SiteFooter from "./SiteFooter";

export default function LegalPageLayout({ title, subtitle, children }) {
  return (
    <>
      <header className="legal-topbar">
        <Link href="/" className="legal-home-link">
          <svg className="logo-mark" width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <polygon points="11,1 21,6 21,16 11,21 1,16 1,6" stroke="#00d4ff" strokeWidth="1.2" fill="none" />
            <polygon points="11,5 17,8 17,14 11,17 5,14 5,8" stroke="#00d4ff" strokeWidth=".6" fill="rgba(0,212,255,.08)" />
            <circle cx="11" cy="11" r="2" fill="#00d4ff" />
          </svg>
          <span className="logo">Threat<span>Recon</span></span>
        </Link>
      </header>
      <main className="legal-page">
        {title ? <h1 className="page-title">{title}</h1> : null}
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
        <div className="prose legal-prose">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
