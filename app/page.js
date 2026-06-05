import StructuredData from "../components/StructuredData";
import { websiteStructuredData } from "./structured-data";
import { publicRoutes } from "./site";

export default function Page() {
  const linkedRoutes = publicRoutes.filter(route =>
    ["/analyzer", "/threat-kb", "/re-tools", "/cheat-sheet", "/sandboxes", "/about", "/security"].includes(route.path)
  );

  return (
    <>
      <StructuredData data={websiteStructuredData} />
      <main id="crawler-home" className="page active" aria-labelledby="crawler-title">
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-tag">Browser based analysis · static analysis · SOC analyst training</div>
            <h1 id="crawler-title">Analyze suspicious files locally in your browser.</h1>
            <p className="hero-sub">
              ThreatRecon.io helps analysts perform static malware triage, IOC extraction, MITRE ATT&CK
              mapping, YARA style rule drafting, Sigma style detection drafting, and analyst reporting
              without sample uploads or account requirements.
            </p>
            <ul className="trust-badges">
              <li>malware triage</li>
              <li>threat hunting</li>
              <li>IOC extraction</li>
              <li>YARA drafts</li>
              <li>Sigma drafts</li>
            </ul>
            <div className="cta-row">
              <a className="cta cta-primary" href="/analyzer">Open Analyzer</a>
              <a className="cta" href="/security">Read Security Model</a>
            </div>
            <div className="creator-line">ThreatRecon.io was built by Andre Boone.</div>
          </div>
          <div className="feature-grid">
            <div className="feature-card">
              <h2>Static Analysis</h2>
              <p>Review headers, strings, entropy, imports, sections, suspicious APIs, and local hashes without executing the artifact.</p>
            </div>
            <div className="feature-card">
              <h2>IOC Extraction</h2>
              <p>Extract domains, URLs, IPs, hashes, registry keys, file paths, mutexes, and other analyst indicators for validation.</p>
            </div>
            <div className="feature-card">
              <h2>Detection Drafting</h2>
              <p>Create YARA and Sigma style drafts from local findings, then review and tune them before production use.</p>
            </div>
            <div className="feature-card">
              <h2>Threat Hunting</h2>
              <p>Generate Splunk, Defender KQL, Elastic, blocklist, and EDR hunt outputs from the same browser based analysis.</p>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-kicker">Public Sections</div>
          <h2>Explore ThreatRecon.io</h2>
          <div className="seo-topic-grid">
            {linkedRoutes.map(route => (
              <div key={route.path}>
                <h2><a href={route.path}>{route.label}</a></h2>
                <p>{route.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section seo-overview">
          <div className="section-kicker">ThreatRecon.io</div>
          <h2>Static Malware Analysis</h2>
          <p>
            ThreatRecon.io is a browser based static malware triage workbench built for safe first pass
            analysis of suspicious scripts, logs, IOCs, command lines, and text artifacts. It helps analysts
            perform local file analysis, extract indicators, identify suspicious behaviors, map findings to
            MITRE ATT&CK, decode obfuscated content, generate draft YARA and Sigma rules, and prepare analyst
            reporting for review.
          </p>
          <p>
            All analysis is performed locally in the browser. ThreatRecon does not upload samples, execute files,
            detonate malware, or submit artifacts to third party services automatically. External sandbox and
            reputation links are manual analyst pivots only.
          </p>
          <div className="seo-topic-grid">
            <div>
              <h2>IOC Extraction and Threat Hunting</h2>
              <p>Extract indicators and generate safe threat hunting output for Splunk, Defender KQL, Elastic, DNS, firewall, and EDR workflows.</p>
            </div>
            <div>
              <h2>Reverse Engineering Support</h2>
              <p>Review strings, entropy, PE headers, imports, sections, suspicious APIs, deobfuscation output, and tool guidance for authorized analysis.</p>
            </div>
            <div>
              <h2>Privacy and Safety</h2>
              <p>Files stay in the browser. ThreatRecon does not require accounts, logins, sample uploads, or automatic artifact submission.</p>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-kicker">Workflow</div>
          <h2>How It Works</h2>
          <div className="step-grid">
            <div className="step-card"><span>01</span><p>Drop a suspicious file locally</p></div>
            <div className="step-card"><span>02</span><p>Review headers, strings, entropy, imports, sections, and suspicious APIs</p></div>
            <div className="step-card"><span>03</span><p>Map evidence to MITRE ATT&CK behavior</p></div>
            <div className="step-card"><span>04</span><p>Export analyst notes, IOCs, YARA drafts, Sigma drafts, and reports</p></div>
          </div>
        </section>

        <section className="landing-section landing-split">
          <div className="trust-panel">
            <div className="section-kicker">Privacy and Safety</div>
            <h2>Browser based static analysis</h2>
            <p>Files are processed locally in your browser and are not uploaded to ThreatRecon.io.</p>
            <p>ThreatRecon.io is designed for browser based static analysis. Files are not uploaded to ThreatRecon.io. The platform does not require an account, does not require a login, and does not collect submitted samples.</p>
          </div>
          <div className="trust-panel">
            <div className="section-kicker">Responsible Use</div>
            <h2>Defensive use disclaimer</h2>
            <p>ThreatRecon.io is built for defensive security education, malware triage practice, and analyst workflow training. Users are responsible for using the platform legally and ethically.</p>
          </div>
        </section>

        <section className="landing-section walkthrough-card">
          <div className="walkthrough-copy">
            <div className="section-kicker">Walkthrough</div>
            <h2>Static Malware Triage Walkthrough</h2>
            <p>The safe sample <code>invoice_update.exe</code> demonstrates how an analyst reviews strings, suspicious APIs, IOCs, entropy, MITRE ATT&CK behavior, and final reporting. It uses placeholder training content only, with no live infrastructure or sensitive identifiers.</p>
          </div>
          <div className="walkthrough-art" aria-hidden="true">
            <div className="walk-row"><span>sample</span><strong>invoice_update.exe</strong></div>
            <div className="walk-row"><span>mode</span><strong>static triage</strong></div>
            <div className="walk-row"><span>output</span><strong>analyst report</strong></div>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-kicker">Output Preview</div>
          <h2>Visual proof placeholders</h2>
          <div className="proof-grid">
            <div className="proof-card"><div className="proof-bar"></div><h3>Analyzer Overview</h3><p>Score, verdict, static metadata, and workflow summary.</p></div>
            <div className="proof-card"><div className="proof-bar"></div><h3>IOC Extraction</h3><p>Structured indicators with actionability and hunt context.</p></div>
            <div className="proof-card"><div className="proof-bar"></div><h3>MITRE ATT&CK Mapping</h3><p>Tactics, techniques, evidence, confidence, and detection ideas.</p></div>
            <div className="proof-card"><div className="proof-bar"></div><h3>YARA Draft</h3><p>Analyst-reviewed draft rule generated from static findings.</p></div>
            <div className="proof-card"><div className="proof-bar"></div><h3>Sigma Draft</h3><p>Experimental detection logic for command line and registry behavior.</p></div>
            <div className="proof-card"><div className="proof-bar"></div><h3>Analyst Report Export</h3><p>Markdown, JSON, IOC CSV, blocklist, YARA, and Sigma outputs.</p></div>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-kicker">Trust Boundary</div>
          <h2>Known Limitations</h2>
          <p>
            ThreatRecon.io provides static analysis assistance and analyst training workflows. Static analysis can
            identify suspicious indicators, strings, file traits, and behavior patterns, but results should be
            reviewed by a human analyst and should not be treated as a complete malware verdict by themselves.
          </p>
        </section>
      </main>

      <div id="client-app">
      </div>
      <script type="module" src="/assets/js/client-shell.js" />
    </>
  );
}
