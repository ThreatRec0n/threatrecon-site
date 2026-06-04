// Static trusted application shell only (build-time constant).
// Never interpolate user paste, uploads, decoded payloads, IOCs, or analysis output here.
// All dynamic results are rendered by public/assets/js/app.js via escapeHtml / textContent.
export const THREATRECON_BODY = `
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
    <button class="nav-tab active" data-page="home">Home</button>
    <button class="nav-tab" data-page="analyzer">Analyzer</button>
    <button class="nav-tab" data-page="kb">Threat KB</button>
    <button class="nav-tab" data-page="tools">RE Tools</button>
    <button class="nav-tab" data-page="cheatsheet">Cheat Sheet</button>
    <button class="nav-tab" data-page="sandboxes">Sandboxes</button>
    <button class="nav-tab" data-page="security">Security</button>
    <button class="nav-tab" data-page="about">About</button>
  </nav>
  <span class="version">v3.0</span>
</div>

<!-- ============ HOME ============ -->
<div class="page active" id="page-home">
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-tag">Threat Intelligence Platform</div>
      <h1>Browser-Based Malware Triage Workbench</h1>
      <p class="hero-sub">Analyze suspicious scripts, logs, IOCs, and text artifacts locally with static detection, deobfuscation, MITRE ATT&amp;CK mapping, and analyst-ready reporting.</p>
      <ul class="trust-badges">
        <li>Local static analysis</li>
        <li>No sample upload</li>
        <li>No API calls by default</li>
        <li>Real hash calculation</li>
        <li>ATT&amp;CK mapped output</li>
      </ul>
      <div class="cta-row">
        <a class="cta cta-primary" data-nav="analyzer" href="#analyzer">&#9654; Open Analyzer</a>
        <a class="cta" id="cta-demo" href="#analyzer">Load Demo</a>
        <a class="cta" data-nav="security" href="#security">Read Security Model</a>
      </div>
    </div>
    <div class="feature-grid">
      <div class="feature-card"><h3>Static Analysis</h3><p>SHA-1/SHA-256 hashing, Shannon entropy, and string classification — no execution, ever.</p></div>
      <div class="feature-card"><h3>IOC Extraction</h3><p>IPs, URLs, domains, onion services, hashes, registry keys, paths, BTC, and CVEs with safe pivot links.</p></div>
      <div class="feature-card"><h3>Behavior &amp; YARA</h3><p>50+ behavioral rules and YARA-style signatures across persistence, evasion, C2, and impact.</p></div>
      <div class="feature-card"><h3>ATT&amp;CK Mapping</h3><p>Findings mapped to MITRE ATT&amp;CK techniques with direct links to the knowledge base.</p></div>
      <div class="feature-card"><h3>Deobfuscation</h3><p>Base64, ROT13, hex, URL, and PowerShell EncodedCommand decoding with multi-layer detection — decoded inert, never run.</p></div>
      <div class="feature-card"><h3>Analyst Reports</h3><p>Structured report with exec summary, findings, capabilities, IOCs, and response actions. Export JSON / Markdown / YARA.</p></div>
    </div>
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
        <strong>File Safety Gate:</strong> This tool performs <strong>static analysis only</strong>. Files are parsed locally in your browser; they are not uploaded. Never executed. Never stored on a server. Max upload 1&nbsp;MB. Binary/archive types are blocked.
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
        <div class="safety-gate safety-gate--compact">Allowed: txt, log, ps1, bat, cmd, sh, py, js, vbs, php, rb, pl, conf, json, xml, ini, csv, yar. Blocked: exe, dll, bin, com, msi, sys, scr, jar, iso, img, docm, xlsm, zip, 7z, rar. <strong>Files are read locally in your browser. Nothing is uploaded, stored, or executed.</strong></div>
        <div class="drop-zone" id="drop-zone">
          <div class="drop-icon">&#8679;</div>
          <div class="drop-txt">Drop a text file here or click to select local file</div>
          <div class="drop-sub">Local browser analysis only &middot; no upload &middot; read as text only</div>
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
    </div>

    <div class="analyzer-grid analyzer-grid--stack">
      <div class="panel" data-section="pe">
        <div class="panel-head"><div class="dot dot-purple"></div><div class="panel-head-text"><span class="panel-head-title">Static PE Triage</span><span class="panel-head-desc">MZ/PE headers, sections, imports, entropy, and packer hints when visible locally</span></div></div>
        <div class="panel-body" id="pe-body"></div>
      </div>
      <div class="panel" data-section="script">
        <div class="panel-head"><div class="dot dot-orange"></div><div class="panel-head-text"><span class="panel-head-title">Script Analysis</span><span class="panel-head-desc">PowerShell, JavaScript, VBScript, Batch, Python, HTA, and macro-style indicators</span></div></div>
        <div class="panel-body" id="script-body"></div>
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
        <button class="btn-export" id="exp-copyioc">&#10697; Copy IOCs</button>
        <button class="btn-export" id="exp-copyreport">&#10697; Copy Report</button>
      </div>
      <p class="field-hint">Reports may contain sensitive IOCs, paths, hashes, or investigation notes. Store and share responsibly.</p>
    </div>

    <!-- ===== Optional Threat Intel Enrichment (off by default, manual only) ===== -->
    <div class="panel" data-section="enrich" id="enrich-panel" style="display:none">
      <div class="panel-head"><div class="dot dot-blue"></div><div class="panel-head-text"><span class="panel-head-title">Threat Intel Enrichment</span><span class="panel-head-desc">Optional &middot; third-party data</span></div><button class="btn-export btn-export--head" id="btn-enrich">&#8635; Enrich IOCs</button></div>
      <div class="panel-body">
        <div class="enrich-label">Optional. Sends only extracted IOCs (hashes, URLs, domains, public IPs, CVEs, onion addresses) to a configured same-origin enrichment proxy. Does not send files, full sample content, decoded payloads, private IPs, registry keys, file paths, or emails. Requires a serverless deployment with API keys; on static-only hosting it will report "unavailable". Results are third-party intelligence and are not absolute truth.</div>
        <div id="enrich-body"><div class="no-ioc">Enrichment not run yet. Click &ldquo;Enrich IOCs&rdquo; to query configured providers (optional).</div></div>
        <div class="enrich-attrib">This product uses data from the NVD API but is not endorsed or certified by the NVD. Other results may come from MalwareBazaar, ThreatFox, URLhaus (abuse.ch), VirusTotal, and OTX AlienVault when configured.</div>
      </div>
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
    <button class="kb-filter" data-filter="ai-malware">AI Malware</button>
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
        <li><span class="ok">No network calls.</span> The Content-Security-Policy sets <code>connect-src 'none'</code> — there is no fetch, XHR, or WebSocket.</li>
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
      <p>Keeping everything client-side means there is no server to attack, no sample storage to leak, and no API bills. The smallest attack surface is the one that never executes the sample and never phones home.</p>
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
      <a data-nav="analyzer" href="#analyzer">Analyzer</a>
      <a data-nav="security" href="#security">Security</a>
      <a data-nav="about" href="#about">About</a>
      <a href="/legal">Legal</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
    </div>
  </div>
</footer>

<div class="toast" id="toast"></div>
`;
