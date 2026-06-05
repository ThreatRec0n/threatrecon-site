import Link from "next/link";
import LegalPageLayout from "./LegalPageLayout";

export default function PublicSectionPage({ title, subtitle, sections, cta }) {
  return (
    <LegalPageLayout title={title} subtitle={subtitle}>
      {cta ? (
        <div className="panel">
          <div className="panel-head"><div className="dot dot-green"></div>{cta.title}</div>
          <div className="panel-body">
            <p>{cta.description}</p>
            <p><Link href={cta.href}>{cta.label}</Link></p>
          </div>
        </div>
      ) : null}
      {sections.map(section => (
        <div className="panel" key={section.title}>
          <div className="panel-head"><div className={`dot ${section.dot || "dot-blue"}`}></div>{section.title}</div>
          <div className="panel-body">
            {section.body.map(item => (
              <p key={item}>{item}</p>
            ))}
            {section.links ? (
              <ul>
                {section.links.map(link => (
                  <li key={link.href}><Link href={link.href}>{link.label}</Link></li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      ))}
    </LegalPageLayout>
  );
}
