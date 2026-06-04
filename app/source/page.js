import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "Source — ThreatRecon",
  robots: { index: false, follow: false },
};

export default function SourcePage() {
  return (
    <LegalPageLayout title="" subtitle="">
      <div className="source-easter">
        <p className="source-phrase">May the Sudo be with you!</p>
        {/* Local generic sci-fi helmet silhouette — not a copyrighted asset */}
        <img
          src="/assets/img/vader-silhouette.svg"
          alt=""
          width={200}
          height={240}
          className="source-helmet"
        />
      </div>
    </LegalPageLayout>
  );
}
