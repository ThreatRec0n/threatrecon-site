// Static trusted application shell only (build-time constant).
// Never interpolate user paste, uploads, decoded payloads, IOCs, or analysis output here.
// All dynamic results are rendered by public/assets/js/app.js via escapeHtml / textContent.
export const THREATRECON_BODY = `
<a class="skip-link" href="#page-home">Skip to content</a>
<div class="topbar">
  <div class="logo-wrap">
    <svg class="logo-mark" width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true"><polygon points="11,1 21,6 21,16 11,21 1,16 1,6" stroke="#00d4ff" stroke-width="1.2" fill="none"/><polygon points="11,5 17,8 17,14 11,17 5,14 5,8" stroke="#00d4ff" stroke-width=".6" fill="rgba(0,212,255,.08)"/><circle cx="11" cy="11" r="2" fill="#00d4ff"/></svg>
    <div class="logo-text">
      <span class="logo">Threat<span>Recon</span></span>
      <span class="logo-sub">Malware Triage Workbench</span>
    </div>
    <span class="badge-live">LOCAL</span>
  </div>
  <input type="checkbox" id="nav-toggle" class="nav-toggle" tabindex="-1" aria-hidden="true" />
  <label for="nav-toggle" class="nav-menu-btn" aria-label="Open navigation menu"><span></span><span></span><span></span></label>
  <nav class="nav-tabs" role="navigation" aria-label="Main">
    <a class="nav-tab active" data-page="home" href="/">Home</a>
    <a class="nav-tab" data-page="analyzer" href="/analyzer">Analyzer</a>
    <a class="nav-tab" data-page="kb" href="/threat-kb">Threat KB</a>
    <a class="nav-tab" data-page="tools" href="/re-tools">RE Tools</a>
    <a class="nav-tab" data-page="cheatsheet" href="/cheat-sheet">Cheat Sheet</a>
    <a class="nav-tab" data-page="sandboxes" href="/sandboxes">Sandboxes</a>
    <a class="nav-tab" data-page="security" href="/security">Security</a>
    <a class="nav-tab" data-page="about" href="/about">About</a>
  </nav>
  <span class="version">v3.0</span>
</div>

<!-- ============ HOME ============ -->
<div class="page active" id="page-home">
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-tag">Browser based analysis &middot; static analysis &middot; SOC analyst training</div>
      <h1>Analyze suspicious files locally in your browser.</h1>
      <p class="hero-sub">ThreatRecon.io helps analysts perform static malware triage, IOC extraction, MITRE ATT&amp;CK mapping, YARA style rule drafting, Sigma style detection drafting, and analyst reporting without sample uploads or account requirements.</p>
      <ul class="trust-badges">
        <li>malware triage</li>
        <li>threat hunting</li>
        <li>IOC extraction</li>
        <li>YARA drafts</li>
        <li>Sigma drafts</li>
      </ul>
      <div class="cta-row">
        <a class="cta cta-primary" data-nav="analyzer" href="/analyzer">&#9654; Open Analyzer</a>
        <a class="cta" id="cta-demo" href="#analyzer">Load Demo</a>
        <a class="cta" data-nav="security" href="/security">Read Security Model</a>
      </div>
      <div class="creator-line">ThreatRecon.io was built by Andre Boone.</div>
    </div>
    <div class="feature-grid">
      <div class="feature-card"><h3>Static Analysis</h3><p>Review headers, strings, entropy, imports, sections, suspicious APIs, and local hashes without executing the artifact.</p></div>
      <div class="feature-card"><h3>IOC Extraction</h3><p>Extract domains, URLs, IPs, hashes, registry keys, file paths, mutexes, and other analyst indicators for validation.</p></div>
      <div class="feature-card"><h3>Detection Drafting</h3><p>Create YARA and Sigma style drafts from local findings, then review and tune them before production use.</p></div>
      <div class="feature-card"><h3>Threat Hunting</h3><p>Generate Splunk, Defender KQL, Elastic, blocklist, and EDR hunt outputs from the same browser based analysis.</p></div>
      <div class="feature-card"><h3>MITRE ATT&amp;CK</h3><p>Map static evidence to MITRE ATT&amp;CK tactics and techniques with detection ideas for SOC analyst training.</p></div>
      <div class="feature-card"><h3>Analyst Reports</h3><p>Export concise reports, IOCs, YARA drafts, Sigma drafts, and comparison notes for authorized defensive workflows.</p></div>
    </div>
  </section>

  <section class="landing-section seo-overview">
    <div class="section-kicker">ThreatRecon.io</div>
    <h2>Static Malware Analysis</h2>
    <p>ThreatRecon.io is a browser based static malware triage workbench built for safe first pass analysis of suspicious scripts, logs, IOCs, command lines, and text artifacts. It helps analysts perform local file analysis, extract indicators, identify suspicious behaviors, map findings to MITRE ATT&amp;CK, decode obfuscated content, generate draft YARA and Sigma rules, and prepare analyst reporting for review.</p>
    <p>All analysis is performed locally in the browser. ThreatRecon does not upload samples, execute files, detonate malware, or submit artifacts to third party services automatically. External sandbox and reputation links are manual analyst pivots only.</p>
    <div class="seo-topic-grid">
      <div><h2>IOC Extraction and Threat Hunting</h2><p>Extract indicators and generate safe threat hunting output for Splunk, Defender KQL, Elastic, DNS, firewall, and EDR workflows.</p></div>
      <div><h2>Detection Engineering</h2><p>Create draft YARA and Sigma content from local evidence, then review and tune the output before operational use.</p></div>
      <div><h2>Reverse Engineering Support</h2><p>Review strings, entropy, PE headers, imports, sections, suspicious APIs, deobfuscation output, and tool guidance for authorized analysis.</p></div>
      <div><h2>Privacy and Safety</h2><p>Files stay in the browser. ThreatRecon does not require accounts, logins, sample uploads, or automatic artifact submission.</p></div>
    </div>
  </section>

  <section class="landing-section">
    <div class="section-kicker">Workflow</div>
    <h2>How It Works</h2>
    <div class="step-grid">
      <div class="step-card"><span>01</span><p>Drop a suspicious file locally</p></div>
      <div class="step-card"><span>02</span><p>Review headers, strings, entropy, imports, sections, and suspicious APIs</p></div>
      <div class="step-card"><span>03</span><p>Map evidence to MITRE ATT&amp;CK behavior</p></div>
      <div class="step-card"><span>04</span><p>Export analyst notes, IOCs, YARA drafts, Sigma drafts, and reports</p></div>
    </div>
  </section>

  <section class="landing-section landing-split">
    <div class="trust-panel">
      <div class="section-kicker">Privacy and Safety</div>
      <h2>Browser based static analysis</h2>
      <p>ThreatRecon.io is designed for browser based static analysis. Files are not uploaded to ThreatRecon.io. The platform does not require an account, does not require a login, and does not collect submitted samples.</p>
    </div>
    <div class="trust-panel">
      <div class="section-kicker">Responsible Use</div>
      <h2>Defensive use disclaimer</h2>
      <p>ThreatRecon.io is built for defensive security education, malware triage practice, and analyst workflow training. Users are responsible for using the platform legally and ethically.</p>
    </div>
  </section>

  <section class="landing-section walkthrough-card">
    <div class="walkthrough-copy">
      <div class="section-kicker">Walkthrough</div>
      <h2>Static Malware Triage Walkthrough</h2>
      <p>The safe sample <code>invoice_update.exe</code> demonstrates how an analyst reviews strings, suspicious APIs, IOCs, entropy, MITRE ATT&amp;CK behavior, and final reporting. It uses placeholder training content only, with no real malware names, live infrastructure, victim data, or sensitive identifiers.</p>
    </div>
    <div class="walkthrough-art" aria-hidden="true">
      <div class="walk-row"><span>sample</span><strong>invoice_update.exe</strong></div>
      <div class="walk-row"><span>mode</span><strong>static triage</strong></div>
      <div class="walk-row"><span>output</span><strong>analyst report</strong></div>
    </div>
  </section>

  <section class="landing-section">
    <div class="section-kicker">Output Preview</div>
    <h2>Visual proof placeholders</h2>
    <div class="proof-grid">
      <div class="proof-card"><div class="proof-bar"></div><h3>Analyzer Overview</h3><p>Score, verdict, static metadata, and workflow summary.</p></div>
      <div class="proof-card"><div class="proof-bar"></div><h3>IOC Extraction</h3><p>Structured indicators with actionability and hunt context.</p></div>
      <div class="proof-card"><div class="proof-bar"></div><h3>MITRE ATT&amp;CK Mapping</h3><p>Tactics, techniques, evidence, confidence, and detection ideas.</p></div>
      <div class="proof-card"><div class="proof-bar"></div><h3>YARA Draft</h3><p>Analyst-reviewed draft rule generated from static findings.</p></div>
      <div class="proof-card"><div class="proof-bar"></div><h3>Sigma Draft</h3><p>Experimental detection logic for command line and registry behavior.</p></div>
      <div class="proof-card"><div class="proof-bar"></div><h3>Analyst Report Export</h3><p>Markdown, JSON, IOC CSV, blocklist, YARA, and Sigma outputs.</p></div>
    </div>
  </section>

  <section class="landing-section">
    <div class="section-kicker">Trust Boundary</div>
    <h2>Known Limitations</h2>
    <p>ThreatRecon.io provides static analysis assistance and analyst training workflows. Static analysis can identify suspicious indicators, strings, file traits, and behavior patterns, but results should be reviewed by a human analyst and should not be treated as a complete malware verdict by themselves.</p>
  </section>
</div>

<!-- ============ ANALYZER ============ -->
<!--
  Static only. No detonation. No exfiltration. No cloud calls.
  The safest malware lab is the one that never executes the sample.
-->
<div class="page" id="page-analyzer">
  <div class="analyzer-header">
    <div class="analyzer-header-main">
      <div class="page-title">Malware Triage Workbench</div>
      <div class="page-sub">Static &middot; Behavioral &middot; IOC &middot; YARA &middot; Entropy &middot; Deobfuscation &middot; ATT&amp;CK — local browser analysis only.</div>
      <div class="safety-gate">
        <strong>File Safety Gate:</strong> Files are processed locally in your browser and are not uploaded to ThreatRecon.io. Static analysis only. Never executed. Never stored on a server.
      </div>
    </div>
    <div class="analyzer-stats">
      <div>RULE DB: <span class="stat-green">50+ behaviors &middot; 17 YARA &middot; 40+ MITRE</span></div>
      <div>RUNTIME: <span class="stat-accent">100% in-browser &middot; offline-capable</span></div>
    </div>
  </div>

  <div class="analyzer-grid">
    <!-- INPUT PANEL -->
    <div class="panel">
      <div class="panel-head"><div class="dot dot-blue"></div>Sample Input</div>
      <div class="input-tabs">
        <button class="itab active" data-tab="paste">Paste</button>
        <button class="itab" data-tab="upload">Select Local File</button>
        <button class="itab" data-tab="url">URL / Hash</button>
      </div>
      <div class="ipane active" id="ipane-paste">
        <p class="field-hint">Paste suspicious script, IOC list, command output, or log content.</p>
        <textarea id="input-text" placeholder="Paste a script (.ps1 .bat .sh .py .js .vbs .php), log output, IOC list, Base64 blob, hex shellcode, command line, or any suspicious text artifact..."></textarea>
        <div class="field-hint field-hint--spaced">Custom YARA / Regex Patterns (optional, one per line, case-insensitive)</div>
        <p class="field-hint">YARA-style local regex rules are heuristic matches, not a full YARA engine.</p>
        <textarea id="custom-yara" class="textarea-sm" placeholder="mimikatz&#10;sekurlsa&#10;stratum\\+tcp"></textarea>
      </div>
      <div class="ipane" id="ipane-upload">
        <div class="safety-gate safety-gate--compact">Files are processed locally in your browser and are not uploaded to ThreatRecon.io. Allowed: text/script/log files and PE-like binaries up to the browser-safe size cap. Archives and Office macro containers remain blocked. <strong>Nothing is uploaded, stored, or executed.</strong></div>
        <div class="drop-zone" id="drop-zone">
          <div class="drop-icon">&#8679;</div>
          <div class="drop-txt">Drop a text file here or click to select local file</div>
          <div class="drop-sub">Local browser analysis only &middot; no upload &middot; no execution</div>
        </div>
        <div class="file-loaded" id="file-loaded" style="display:none"></div>
        <div class="file-blocked" id="file-blocked" style="display:none"></div>
        <input type="file" id="file-input" class="file-input-hidden" />
      </div>
      <div class="ipane" id="ipane-url">
        <p class="field-hint">IOC lookup — paste an indicator; it becomes the analysis input and renders safe pivot links.</p>
        <div class="url-row">
          <input type="text" class="url-input" id="url-input" placeholder="IP, domain, URL, MD5, SHA-1, or SHA-256 hash..." />
          <button class="btn-small" id="btn-loadioc">LOAD</button>
        </div>
      </div>

      <div class="mode-row">
        <span class="mode-label">Mode</span>
        <button class="mode-btn active" data-mode="deep">Deep scan</button>
        <button class="mode-btn" data-mode="quick">Quick scan</button>
        <button class="mode-btn" data-mode="ioc">IOC-only</button>
        <button class="mode-btn" data-mode="deobf">Deobfuscation</button>
      </div>

      <div class="mode-row workflow-row">
        <span class="mode-label">Workflow</span>
        <button class="workflow-btn active" data-workflow="SOC Triage">SOC Triage</button>
        <button class="workflow-btn" data-workflow="Malware Analysis">Malware Analysis</button>
        <button class="workflow-btn" data-workflow="Reverse Engineering Prep">RE Prep</button>
        <button class="workflow-btn" data-workflow="Threat Hunting">Threat Hunting</button>
        <button class="workflow-btn" data-workflow="Incident Report">Incident Report</button>
      </div>

      <div class="analyze-row">
        <button class="btn-analyze" id="btn-analyze">&#9654; ANALYZE</button>
        <button class="btn-clear" id="btn-clear">CLEAR</button>
        <button class="btn-demo" id="btn-demo">DEMO</button>
        <div class="engine-status">
          <div class="status-led" id="status-led"></div>
          <span id="status-txt">All engines ready</span>
        </div>
        <p class="field-hint analyze-hint">Demo mode uses safe text-only indicators.</p>
      </div>
    </div>

    <!-- SCORE + STATIC -->
    <div class="analyzer-side-col">
      <div class="panel panel-score" id="score-panel" data-section="score" style="display:none">
        <div class="panel-head"><div class="dot dot-red"></div><span class="panel-head-title">Threat Score</span></div>
        <div class="panel-body">
          <div class="score-wrap">
            <div class="score-big" id="score-num">00</div>
            <div class="score-meta">
              <div class="score-label">Composite Threat Score / 100</div>
              <div class="score-bar-outer"><div class="score-bar-inner" id="score-bar" style="width:0%"></div></div>
              <div id="verdict-wrap"></div>
            </div>
          </div>
          <div id="score-breakdown" class="score-breakdown"></div>
        </div>
      </div>
      <div class="panel" id="static-panel" data-section="static" style="display:none">
        <div class="panel-head"><div class="dot dot-green"></div><div class="panel-head-text"><span class="panel-head-title">Static Analysis</span><span class="panel-head-desc">Hashes &amp; metadata — MD5, SHA-1, SHA-256 calculated locally</span></div></div>
        <div class="panel-body" id="static-body"></div>
      </div>
    </div>
  </div>

  <div class="spinner" id="spinner"><div class="spin-dot"></div><span id="spinner-txt">Initializing engines...</span></div>

  <div class="panel compare-panel">
    <div class="panel-head"><div class="dot dot-purple"></div><div class="panel-head-text"><span class="panel-head-title">Sample Comparison</span><span class="panel-head-desc">Compare two artifacts locally for shared IOCs, strings, behaviors, rules, and ATT&amp;CK techniques</span></div></div>
    <div class="panel-body">
      <div class="compare-grid">
        <textarea id="compare-a" class="textarea-sm" placeholder="Input A — paste sample text, strings, IOCs, or commands"></textarea>
        <textarea id="compare-b" class="textarea-sm" placeholder="Input B — paste second sample"></textarea>
      </div>
      <div class="analyze-row analyze-row--compact"><button class="btn-export" id="btn-compare">Compare Samples</button><span class="field-hint">Local only. No upload, no API calls, no execution.</span></div>
      <div id="compare-body"></div>
    </div>
  </div>

  <!-- RESULTS -->
  <div class="results-wrap" id="results-wrap">
    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="ioc">
        <div class="panel-head"><div class="dot dot-red"></div><div class="panel-head-text"><span class="panel-head-title">IOC Extraction</span><span class="panel-head-desc">IPs, domains, hashes, paths — safe pivot links</span></div><span id="ioc-total" class="panel-head-count"></span></div>
        <div class="panel-body" id="ioc-body"></div>
      </div>
      <div class="panel" data-section="behavior">
        <div class="panel-head"><div class="dot dot-orange"></div><div class="panel-head-text"><span class="panel-head-title">Behavioral Indicators</span><span class="panel-head-desc">Heuristic behavior rules with ATT&amp;CK technique refs</span></div><span id="beh-total" class="panel-head-count"></span></div>
        <div class="panel-body" id="beh-body"></div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="entropy">
        <div class="panel-head"><div class="dot dot-yellow"></div><span class="panel-head-title">Shannon Entropy Analysis</span></div>
        <div class="panel-body" id="entropy-body"></div>
      </div>
      <div class="panel" data-section="strings">
        <div class="panel-head"><div class="dot dot-blue"></div><span class="panel-head-title">Extracted Strings Classification</span></div>
        <div class="panel-body panel-body--scroll" id="strings-body"></div>
      </div>
      <div class="panel" data-section="strings-intel">
        <div class="panel-head"><div class="dot dot-blue"></div><div class="panel-head-text"><span class="panel-head-title">Strings Intelligence</span><span class="panel-head-desc">Grouped static strings with confidence labels</span></div></div>
        <div class="panel-body panel-body--scroll" id="strings-intel-body"></div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="pe">
        <div class="panel-head"><div class="dot dot-purple"></div><div class="panel-head-text"><span class="panel-head-title">Static PE Triage</span><span class="panel-head-desc">MZ/PE headers, sections, API strings, entropy, and packer hints when visible locally</span></div></div>
        <div class="panel-body" id="pe-body"></div>
      </div>
      <div class="panel" data-section="script">
        <div class="panel-head"><div class="dot dot-orange"></div><div class="panel-head-text"><span class="panel-head-title">Script Analysis</span><span class="panel-head-desc">PowerShell, JavaScript, VBScript, Batch, Python, HTA, and macro-style indicators</span></div></div>
        <div class="panel-body" id="script-body"></div>
      </div>
      <div class="panel" data-section="api-risk">
        <div class="panel-head"><div class="dot dot-red"></div><div class="panel-head-text"><span class="panel-head-title">API Risk Table</span><span class="panel-head-desc">Suspicious imports and API strings with analyst meaning</span></div></div>
        <div class="panel-body" id="api-risk-body"></div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="yara">
        <div class="panel-head"><div class="dot dot-orange"></div><div class="panel-head-text"><span class="panel-head-title">YARA-style local regex rules</span><span class="panel-head-desc">Heuristic pattern matches — not a full YARA engine</span></div><span id="yara-total" class="panel-head-count"></span></div>
        <div class="panel-body" id="yara-body"></div>
      </div>
      <div class="panel" data-section="mitre">
        <div class="panel-head"><div class="dot dot-purple"></div><div class="panel-head-text"><span class="panel-head-title">MITRE ATT&amp;CK Mapping</span><span class="panel-head-desc">Techniques linked to the knowledge base</span></div></div>
        <div class="panel-body" id="mitre-body"></div>
      </div>
      <div class="panel" data-section="attack-table">
        <div class="panel-head"><div class="dot dot-purple"></div><div class="panel-head-text"><span class="panel-head-title">ATT&amp;CK Evidence Table</span><span class="panel-head-desc">Tactic, technique, evidence, confidence, and detection idea</span></div></div>
        <div class="panel-body" id="attack-table-body"></div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="timeline">
        <div class="panel-head"><div class="dot dot-yellow"></div><div class="panel-head-text"><span class="panel-head-title">Attack Timeline</span><span class="panel-head-desc">Initial execution through impact, inferred from static evidence</span></div></div>
        <div class="panel-body" id="timeline-body"></div>
      </div>
      <div class="panel" data-section="ioc-action">
        <div class="panel-head"><div class="dot dot-green"></div><div class="panel-head-text"><span class="panel-head-title">IOC Actionability</span><span class="panel-head-desc">Confidence, actionability, reason, and recommended action</span></div></div>
        <div class="panel-body" id="ioc-action-body"></div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="draft-yara">
        <div class="panel-head"><div class="dot dot-orange"></div><div class="panel-head-text"><span class="panel-head-title">Draft YARA Rule</span><span class="panel-head-desc">Generated from suspicious local static findings</span></div></div>
        <div class="panel-body" id="draft-yara-body"></div>
      </div>
      <div class="panel" data-section="draft-sigma">
        <div class="panel-head"><div class="dot dot-orange"></div><div class="panel-head-text"><span class="panel-head-title">Draft Sigma Rule</span><span class="panel-head-desc">Generated from suspicious process, registry, and script behavior</span></div></div>
        <div class="panel-body" id="draft-sigma-body"></div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="capabilities">
        <div class="panel-head"><div class="dot dot-blue"></div><span class="panel-head-title">Capabilities &amp; Malware Type</span></div>
        <div class="panel-body" id="capabilities-body"></div>
      </div>
      <div class="panel" data-section="recommendations">
        <div class="panel-head"><div class="dot dot-green"></div><span class="panel-head-title">Recommended Next Steps</span></div>
        <div class="panel-body" id="recommendations-body"></div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="re-guidance">
        <div class="panel-head"><div class="dot dot-green"></div><div class="panel-head-text"><span class="panel-head-title">Reverse Engineering Guidance</span><span class="panel-head-desc">Rule-based next steps only — no AI, no external calls</span></div></div>
        <div class="panel-body" id="re-guidance-body"></div>
      </div>
      <div class="panel" data-section="hunting">
        <div class="panel-head"><div class="dot dot-blue"></div><div class="panel-head-text"><span class="panel-head-title">Hunting Queries</span><span class="panel-head-desc">Safe Splunk, Defender KQL, and Elastic templates generated from local findings</span></div></div>
        <div class="panel-body" id="hunting-body"></div>
      </div>
    </div>

    <div class="panel" data-section="detection">
      <div class="panel-head"><div class="dot dot-purple"></div><div class="panel-head-text"><span class="panel-head-title">Detection Engineering</span><span class="panel-head-desc">Sigma, YARA, Splunk, Defender KQL, Elastic, blocklists, DNS, and EDR hunt output</span></div></div>
      <div class="panel-body" id="detection-body"></div>
    </div>

    <div class="panel" data-section="reputation">
      <div class="panel-head"><div class="dot dot-blue"></div><div class="panel-head-text"><span class="panel-head-title">Manual Reputation Pivot</span><span class="panel-head-desc">VirusTotal, MalwareBazaar, ThreatFox, URLhaus, and OTX links — manual only</span></div></div>
      <div class="panel-body" id="reputation-body"></div>
    </div>

    <div class="panel panel-dynamic" data-section="dynamic" id="dynamic-analysis-card">
      <div class="panel-head">
        <div class="dot dot-blue"></div>
        <div class="panel-head-text">
          <span class="panel-head-title">Next Step: Dynamic Analysis</span>
          <span class="panel-head-desc">ThreatRecon completed local static triage. To observe runtime behavior, detonate the sample in a dedicated malware sandbox.</span>
        </div>
      </div>
      <div class="panel-body">
        <div id="dyn-context-actions" class="dyn-context-actions" style="display:none"></div>
        <p class="dyn-lead">Static analysis can identify suspicious strings, IOCs, encoded payloads, and ATT&amp;CK-aligned behaviors. Dynamic analysis helps confirm what the sample actually does when executed, including process activity, network connections, file writes, registry changes, persistence, and evasion behavior.</p>
        <div class="dyn-warning">
          <strong>Important:</strong> Do not execute suspicious files on your own machine. Use an isolated sandbox or a trusted public malware analysis service. External sandbox links open outside ThreatRecon. ThreatRecon does not detonate samples, upload files, or submit IOCs automatically.
        </div>
        <div class="dyn-sandbox-btns">
          <a class="dyn-sandbox-btn" href="https://app.any.run/" target="_blank" rel="noopener noreferrer">Open ANY.RUN <span class="ext-icon" aria-hidden="true">&#8599;</span></a>
          <a class="dyn-sandbox-btn" href="https://www.hybrid-analysis.com/" target="_blank" rel="noopener noreferrer">Open Hybrid Analysis <span class="ext-icon" aria-hidden="true">&#8599;</span></a>
          <a class="dyn-sandbox-btn" href="https://tria.ge/" target="_blank" rel="noopener noreferrer">Open Triage <span class="ext-icon" aria-hidden="true">&#8599;</span></a>
          <a class="dyn-sandbox-btn" href="https://www.joesandbox.com/" target="_blank" rel="noopener noreferrer">Open Joe Sandbox <span class="ext-icon" aria-hidden="true">&#8599;</span></a>
          <a class="dyn-sandbox-btn" href="https://www.virustotal.com/gui/home/upload" target="_blank" rel="noopener noreferrer">Open VirusTotal <span class="ext-icon" aria-hidden="true">&#8599;</span></a>
        </div>
        <h4 class="dyn-section-title">What to submit next</h4>
        <div class="dyn-checklist-grid">
          <div class="dyn-checklist">
            <h5 class="dyn-checklist-head">If you have a file</h5>
            <ul>
              <li>Submit the file to a sandbox only if you are allowed to share it.</li>
              <li>Use private analysis mode when dealing with sensitive client or company data.</li>
              <li>Record process tree, network activity, dropped files, registry changes, and screenshots.</li>
            </ul>
          </div>
          <div class="dyn-checklist">
            <h5 class="dyn-checklist-head">If you only have IOCs</h5>
            <ul>
              <li>Pivot hashes, domains, IPs, and URLs in VirusTotal, OTX, MalwareBazaar, ThreatFox, or URLhaus.</li>
              <li>Compare sandbox output against ThreatRecon&rsquo;s static findings.</li>
              <li>Add confirmed IOCs to the incident report.</li>
            </ul>
          </div>
          <div class="dyn-checklist">
            <h5 class="dyn-checklist-head">If the sample looks like ransomware</h5>
            <ul>
              <li>Check for shadow copy deletion, encryption behavior, ransom note creation, and C2 callback.</li>
              <li>Do not reconnect affected hosts until containment is complete.</li>
            </ul>
          </div>
        </div>
        <h4 class="dyn-section-title">Recommended sandbox by use case</h4>
        <p class="field-hint">General workflow recommendations — not product endorsements.</p>
        <div class="dyn-service-table">
          <div class="dyn-service-row">
            <div class="dyn-service-name">ANY.RUN</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Best for:</span> Interactive malware behavior analysis</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Use when:</span> You need to click, interact, watch process behavior, or inspect network connections.</div>
          </div>
          <div class="dyn-service-row">
            <div class="dyn-service-name">Triage</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Best for:</span> Fast automated malware reports</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Use when:</span> You want a quick detonation report and behavioral summary.</div>
          </div>
          <div class="dyn-service-row">
            <div class="dyn-service-name">Hybrid Analysis</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Best for:</span> Public sample reputation and behavioral reports</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Use when:</span> You want community visibility and existing public reports.</div>
          </div>
          <div class="dyn-service-row">
            <div class="dyn-service-name">Joe Sandbox</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Best for:</span> Deep commercial sandbox reports</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Use when:</span> You need detailed behavior, network, and anti-evasion reporting.</div>
          </div>
          <div class="dyn-service-row">
            <div class="dyn-service-name">VirusTotal</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Best for:</span> Reputation and multi-engine scanning</div>
            <div class="dyn-service-detail"><span class="dyn-svc-key">Use when:</span> You need hash, URL, domain, or file reputation context.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="deobf">
        <div class="panel-head"><div class="dot dot-blue"></div><div class="panel-head-text"><span class="panel-head-title">Deobfuscated Content</span><span class="panel-head-desc">Inert display only — never executed</span></div></div>
        <div class="panel-body" id="deobf-body"></div>
      </div>
    </div>

    <div class="panel panel-report" data-section="report">
      <div class="panel-head"><div class="dot dot-green"></div><div class="panel-head-text"><span class="panel-head-title">Local Analyst Report</span><span class="panel-head-desc panel-head-meta">Local rules engine &middot; FOR610/GREM-style structure &middot; no AI, no cloud</span></div><span class="panel-head-badge">Offline only</span></div>
      <div class="panel-body"><div class="ai-streaming" id="ai-text"></div></div>
      <div class="export-row" id="export-row" style="display:none">
        <button class="btn-export" id="exp-json">&#8659; JSON Report</button>
        <button class="btn-export" id="exp-md">&#8659; Markdown Report</button>
        <button class="btn-export" id="exp-ioc-csv">&#8659; IOC CSV</button>
        <button class="btn-export" id="exp-blocklist">&#8659; Blocklist</button>
        <button class="btn-export" id="exp-yara">&#8659; YARA Rules</button>
        <button class="btn-export" id="exp-sigma">&#8659; Sigma Rule</button>
        <button class="btn-export" id="exp-copyioc">&#10697; Copy IOCs</button>
        <button class="btn-export" id="exp-copyreport">&#10697; Copy Report</button>
      </div>
      <p class="field-hint">Reports may contain sensitive IOCs, paths, hashes, or investigation notes. Store and share responsibly.</p>
    </div>

  </div>
</div>

<!-- ============ THREAT KB ============ -->
<div class="page" id="page-kb">
  <div class="page-title">Threat Intelligence KB</div>
  <div class="page-sub">Educational summaries of malware families compiled from public threat reporting.</div>
  <p class="page-lead">Reference only — the analyzer does not attribute analyzed samples to any of these families or actors.</p>
  <div class="kb-filters">
    <button class="kb-filter active" data-filter="all">ALL</button>
    <button class="kb-filter" data-filter="ransomware">Ransomware</button>
    <button class="kb-filter" data-filter="infostealer">Infostealer</button>
    <button class="kb-filter" data-filter="rat">RAT / Backdoor</button>
    <button class="kb-filter" data-filter="loader">Loader / Dropper</button>
    <button class="kb-filter" data-filter="botnet">Botnet</button>
    <button class="kb-filter" data-filter="wiper">Wiper</button>
  </div>
  <div class="kb-grid" id="kb-grid"></div>
</div>

<!-- ============ RE TOOLS ============ -->
<div class="page" id="page-tools">
  <div class="page-title">RE Tool Reference</div>
  <div class="page-sub">Industry-standard, free / open-source reverse-engineering tooling.</div>
  <div class="tools-grid" id="tools-grid"></div>
</div>

<!-- ============ CHEAT SHEET ============ -->
<div class="page" id="page-cheatsheet">
  <div class="page-title">RE Analyst Cheat Sheet</div>
  <div class="page-sub">Commands, techniques, and analyst workflows.</div>
  <div class="cs-grid" id="cs-grid"></div>
</div>

<!-- ============ SANDBOXES ============ -->
<div class="page" id="page-sandboxes">
  <div class="page-title">Dynamic Analysis &amp; Sandbox Handoff</div>
  <div class="page-sub">External dynamic-analysis and reputation platforms for the step after local static triage.</div>
  <p class="page-lead">ThreatRecon does local static triage first. If the static results show suspicious behavior, use the services below to validate runtime behavior in an isolated environment. Links open only when you click them — ThreatRecon does not upload samples or call external APIs.</p>
  <div class="sb-grid" id="sb-grid"></div>
</div>

<!-- ============ SECURITY NOTICE ============ -->
<div class="page" id="page-security">
  <div class="page-title">Security Notice</div>
  <div class="page-sub">How this workbench protects you, and what it deliberately will not do.</div>
  <div class="prose">
    <div class="panel"><div class="panel-head"><div class="dot dot-green"></div>What this tool is</div><div class="panel-body">
      <ul>
        <li><span class="ok">Static analysis only.</span> It inspects text patterns; it does not run or detonate anything.</li>
        <li><span class="ok">100% in-browser.</span> Hashing, entropy, IOC extraction, rule matching, and decoding all run client-side.</li>
        <li><span class="ok">No analysis network calls.</span> Analytics are limited to site usage and performance telemetry. Analysis content remains local in the browser.</li>
        <li><span class="ok">No upload, no storage.</span> Files you choose are read locally with FileReader and never sent anywhere or persisted server-side.</li>
      </ul>
    </div></div>
    <div class="panel"><div class="panel-head"><div class="dot dot-red"></div>What this tool will not do</div><div class="panel-body">
      <ul>
        <li><span class="no">It does not execute malware.</span> No <code>eval()</code>, no <code>Function()</code> constructor, no script injection of user input.</li>
        <li><span class="no">It does not upload samples</span> to any server or third-party API.</li>
        <li><span class="no">It does not store files.</span> Reload the page and your data is gone.</li>
      </ul>
    </div></div>
    <div class="panel"><div class="panel-head"><div class="dot dot-yellow"></div>Your responsibilities</div><div class="panel-body">
      <ul>
        <li>Do not paste sensitive or proprietary data into a web tool.</li>
        <li>Do not paste live malware unless you understand the risk; even though nothing executes here, handle samples in a controlled environment.</li>
        <li>Treat all results as triage hints — confirm with a dynamic sandbox and reputable threat intelligence.</li>
      </ul>
      <p>Full threat model and hardening details are described on this Security notice and in <a href="/legal">Legal &amp; Responsible Use</a>, <a href="/privacy">Privacy</a>, and internal security documentation aligned with OWASP Top 10 and secure-development practice. The site is production-hardened and privacy-conscious; it is not guaranteed secure against all attacks.</p>
    </div></div>
  </div>
</div>

<!-- ============ ABOUT ============ -->
<div class="page" id="page-about">
  <div class="page-title">About ThreatRecon</div>
  <div class="page-sub">A free, browser-based malware triage and threat-intelligence workbench.</div>
  <div class="prose">
    <div class="panel"><div class="panel-body">
      <p>ThreatRecon is an independent browser-based malware triage workbench built for safe static analysis, IOC extraction, ATT&amp;CK mapping, and analyst workflow support. It performs static analysis, behavior mapping, YARA-style local regex rules, deobfuscation, and report generation entirely in your browser, with no sample upload and no API calls by default.</p>
      <h3 style="margin-top:14px">Why static + browser-only?</h3>
      <p>Keeping analysis local avoids server side sample upload workflows, server side malware sample storage, and required malware-analysis APIs. The smallest sample-handling surface is the one that never executes the sample and never uploads it for analysis.</p>
      <h3 style="margin-top:14px">Limitations</h3>
      <p>Static heuristics cannot observe runtime behavior, unpack encrypted payloads, resolve dynamically built strings, or attribute threat actors with confidence. Always validate findings with a dedicated dynamic sandbox.</p>
      <h3 style="margin-top:14px">Responsible use</h3>
      <p>Use ThreatRecon only for authorized defensive security work. See <a href="/legal">Legal &amp; Responsible Use</a>, <a href="/privacy">Privacy</a>, and <a href="/terms">Terms</a> for site policies.</p>
    </div></div>
  </div>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-about">
      <div class="footer-brand">ThreatRecon.io</div>
      <div class="footer-meta">ThreatRecon.io &middot; Browser-only static malware triage &middot; No sample upload &middot; No API calls by default</div>
    </div>
    <div class="footer-links">
      <a data-nav="analyzer" href="/analyzer">Analyzer</a>
      <a data-nav="kb" href="/threat-kb">Threat KB</a>
      <a data-nav="tools" href="/re-tools">RE Tools</a>
      <a data-nav="cheatsheet" href="/cheat-sheet">Cheat Sheet</a>
      <a data-nav="sandboxes" href="/sandboxes">Sandboxes</a>
      <a href="/security">Security</a>
      <a href="/about">About</a>
      <a href="/legal">Legal</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </div>
  </div>
</footer>

<div class="toast" id="toast"></div>
`;
