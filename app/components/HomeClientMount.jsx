"use client";

import dynamic from "next/dynamic";

const ThreatReconClientApp = dynamic(
  () => import("./ThreatReconClientApp"),
  { ssr: false }
);

export default function HomeClientMount() {
  return <ThreatReconClientApp />;
}
