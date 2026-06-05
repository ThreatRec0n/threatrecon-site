import { notFound } from "next/navigation";
import LegalPageLayout from "../../../components/LegalPageLayout";
import StructuredData from "../../../components/StructuredData";
import { SITE_URL } from "../../site";
import { threatKbArticleStructuredData } from "../../structured-data";
import { articleBySlug, threatKbArticles } from "../articles";

export function generateStaticParams() {
  return threatKbArticles.map(article => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) return {};

  const url = `${SITE_URL}/threat-kb/${article.slug}`;
  const title = article.title;
  const description = article.summary;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: `${title} | ThreatRecon.io`,
      description,
      url,
      siteName: "ThreatRecon.io",
      type: "article",
      images: [
        {
          url: "/og-threatrecon.svg",
          width: 1200,
          height: 630,
          alt: "ThreatRecon.io browser based malware triage workbench preview",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ThreatRecon.io`,
      description,
      images: ["/og-threatrecon.svg"],
    },
  };
}

export default async function ThreatKbArticlePage({ params }) {
  const { slug } = await params;
  const article = articleBySlug(slug);
  if (!article) notFound();

  const structuredData = threatKbArticleStructuredData(article);

  return (
    <>
      <StructuredData data={structuredData} />
      <LegalPageLayout
        title={article.title}
        subtitle={`${article.malwareType} notes for educational and defensive malware triage.`}
      >
        <div className="panel">
          <div className="panel-head"><div className="dot dot-blue"></div>Executive Summary</div>
          <div className="panel-body"><p>{article.summary}</p></div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="dot dot-purple"></div>Malware Type</div>
          <div className="panel-body"><p>{article.malwareType}</p></div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="dot dot-orange"></div>Common Behavior</div>
          <div className="panel-body">
            <ul>{article.behaviors.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="dot dot-green"></div>MITRE ATT&amp;CK Mapping</div>
          <div className="panel-body">
            <ul>{article.mitre.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="dot dot-yellow"></div>IOCs Placeholder</div>
          <div className="panel-body">
            <p>IOCs vary by campaign and should be validated before use. Add confirmed hashes, domains, URLs, IPs, registry paths, file paths, or mutexes from authorized investigations only.</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="dot dot-blue"></div>Detection Opportunities</div>
          <div className="panel-body">
            <ul>{article.detections.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="dot dot-green"></div>Defensive Recommendations</div>
          <div className="panel-body">
            <ul>{article.recommendations.map(item => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
        <div className="panel">
          <div className="panel-head"><div className="dot dot-red"></div>Disclaimer</div>
          <div className="panel-body">
            <p>Educational and defensive use only. These notes support authorized analysis and detection engineering. They are not attribution claims and should not be treated as a complete malware verdict by themselves.</p>
          </div>
        </div>
      </LegalPageLayout>
    </>
  );
}
