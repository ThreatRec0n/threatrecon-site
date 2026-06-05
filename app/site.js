export const SITE_URL = "https://www.threatrecon.io";

export const publicRoutes = [
  {
    path: "/",
    label: "Home",
    title: "ThreatRecon.io | Browser Based Malware Triage and Threat Hunting Lab",
    description:
      "Analyze suspicious files locally in your browser with IOC extraction, strings analysis, entropy checks, MITRE ATT&CK mapping, YARA style drafts, Sigma style drafts, and analyst reporting.",
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    path: "/analyzer",
    label: "Analyzer",
    title: "Analyzer",
    description:
      "Open the ThreatRecon.io browser based malware triage analyzer for local file analysis, IOC extraction, YARA drafts, Sigma drafts, and analyst reporting.",
    changeFrequency: "weekly",
    priority: 0.95,
  },
  {
    path: "/threat-kb",
    label: "Threat KB",
    title: "Threat KB",
    description:
      "ThreatRecon.io threat knowledge base for defensive malware triage notes, MITRE ATT&CK behavior summaries, and detection opportunities.",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/re-tools",
    label: "RE Tools",
    title: "RE Tools",
    description:
      "Free reverse engineering tool references for static analysis, strings review, PE triage, debugging preparation, and defensive malware analysis workflows.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/cheat-sheet",
    label: "Cheat Sheet",
    title: "Cheat Sheet",
    description:
      "ThreatRecon.io analyst cheat sheet for malware triage commands, IOC review, detection engineering, and reverse engineering preparation.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/sandboxes",
    label: "Sandboxes",
    title: "Sandboxes",
    description:
      "Dynamic analysis and sandbox handoff guidance for validating local static malware triage results in authorized defensive workflows.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/about",
    label: "About",
    title: "About",
    description:
      "About ThreatRecon.io, a browser based static malware triage and detection engineering workbench for authorized defensive analysis.",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/security",
    label: "Security",
    title: "Security",
    description:
      "ThreatRecon.io security model, local file analysis design, no account requirement, responsible use, and known limitations.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/privacy",
    label: "Privacy",
    title: "Privacy",
    description:
      "ThreatRecon.io privacy practices for browser based static analysis, local file workflows, no account requirement, and submitted sample handling.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/legal",
    label: "Legal",
    title: "Legal",
    description:
      "ThreatRecon.io legal and acceptable use terms for defensive security education, malware triage practice, and analyst workflow training.",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/terms",
    label: "Terms",
    title: "Terms",
    description:
      "ThreatRecon.io terms of use for browser based static malware triage and analyst workflow support.",
    changeFrequency: "monthly",
    priority: 0.4,
  },
];

export function canonicalUrl(path) {
  return `${SITE_URL}${path === "/" ? "/" : path}`;
}

export function routeMetadata(route) {
  const url = canonicalUrl(route.path);
  const title = route.title.includes("ThreatRecon.io") ? route.title : `${route.title} | ThreatRecon.io`;

  return {
    title: route.title,
    description: route.description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description: route.description,
      url,
      siteName: "ThreatRecon.io",
      type: "website",
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
      title,
      description: route.description,
      images: ["/og-threatrecon.svg"],
    },
  };
}

export function routeByPath(path) {
  return publicRoutes.find(route => route.path === path);
}
