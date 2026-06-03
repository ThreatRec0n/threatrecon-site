// ThreatRecon Signal Found.
// Analyst: if you are reading source, you are already doing recon.
// /anubis watches the threshold
//
// This page is a faithful 1:1 carrier for the finished ThreatRecon static
// markup. The body of the original index.html is preserved verbatim (every
// id, class, data-attribute, inline style, and entity is unchanged) and the
// browser-only engine (public/assets/js/app.js, an ES module) drives it after
// load. Using a single HTML carrier guarantees zero UI/behavior drift versus
// the static build — no logic, scoring, wording, or export was rewritten.

const BODY = `
<div class="topbar">
  <div class="logo-wrap">
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><polygon points="11,1 21,6 21,16 11,21 1,16 1,6" stroke="#00d4ff" stroke-width="1.2" fill="none"/><polygon points="11,5 17,8 17,14 11,17 5,14 5,8" stroke="#00d4ff" stroke-width=".6" fill="rgba(0,212,255,.08)"/><circle cx="11" cy="11" r="2" fill="#00d4ff"/></svg>
    <span class="logo">Threat<span>Recon</span></span>
    <span class="badge-live">LOCAL</span>
  </div>
  <nav class="nav-tabs">
    <button class="nav-tab active" data-page="home">Home</button>
    <button class="nav-tab" data-page="analyzer">Analyzer</button>
    <button class="nav-tab" data-page="kb">Threat KB</button>
    <button class="nav-tab" data-page="tools">RE Tools</button>
    <button class="nav-tab" data-page="cheatsheet">Cheat Sheet</button>
    <button class="nav-tab" data-page="sandboxes">Sandboxes</button>
    <button class="nav-tab" data-page="security">Security</button>
    <button class="nav-tab" data-page="about">About</button>
  </nav>
  <span class="version">v3.0 &middot; Static</span>
</div>

<!-- ============ HOME ============ -->
<div class="page active" id="page-home">
  <section class="hero">
    <div class="hero-tag">Browser-Based Malware Triage Workbench</div>
    <h1>Free <span class="accent">Browser-Based</span> Malware Triage</h1>
    <p class="hero-sub">Static analysis. IOC extraction. ATT&amp;CK mapping. YARA-style matching, deobfuscation, capability inference, and analyst report generation — all running locally in your browser.</p>
    <p class="hero-note">No API cost &middot; No sample upload &middot; No detonation &middot; Nothing leaves your machine</p>
    <div class="cta-row">
      <a class="cta cta-primary" data-nav="analyzer" href="#analyzer">&#9654; Open Analyzer</a>
      <a class="cta" id="cta-demo" href="#analyzer">Load Demo</a>
      <a class="cta" data-nav="security" href="#security">Read Security Model</a>
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
  <div style="display:flex;gap:16px;margin-bottom:14px;align-items:flex-start;flex-wrap:wrap;padding-top:6px">
    <div>
      <div class="page-title">Malware Triage Workbench</div>
      <div class="page-sub">Static &middot; Behavioral &middot; IOC &middot; YARA &middot; Entropy &middot; Deobfuscation &middot; ATT&amp;CK — local browser analysis only; free tool.</div>
      <div class="safety-gate">
        <strong>File Safety Gate:</strong> This tool performs <strong>static analysis only</strong>. Files are read as text in your browser, never executed, never uploaded, and never stored on a server. Do not paste sensitive data. Max upload 1&nbsp;MB. Binary/archive types are blocked.
      </div>
    </div>
    <div style="margin-left:auto;font-size:9px;font-family:var(--term);color:var(--text3);text-align:right">
      <div style="margin-bottom:2px">RULE DB: <span style="color:var(--green)">50+ behaviors &middot; 17 YARA &middot; 40+ MITRE</span></div>
      <div>RUNTIME: <span style="color:var(--accent)">100% in-browser &middot; offline-capable</span></div>
    </div>
  </div>

  <div class="analyzer-grid">
    <!-- INPUT PANEL -->
    <div class="panel">
      <div class="panel-head"><div class="dot dot-blue"></div>Sample Input</div>
      <div class="input-tabs">
        <button class="itab active" data-tab="paste">Paste</button>
        <button class="itab" data-tab="upload">Upload File</button>
        <button class="itab" data-tab="url">URL / Hash</button>
      </div>
      <div class="ipane active" id="ipane-paste">
        <textarea id="input-text" placeholder="Paste a script (.ps1 .bat .sh .py .js .vbs .php), log output, IOC list, Base64 blob, hex shellcode, command line, or any suspicious text artifact..."></textarea>
        <div style="margin-top:10px">
          <div style="font-size:10px;color:var(--text3);font-family:var(--term);margin-bottom:4px">Custom YARA / Regex Patterns (optional, one per line, case-insensitive)</div>
          <textarea id="custom-yara" placeholder="mimikatz&#10;sekurlsa&#10;stratum\\+tcp" style="min-height:80px"></textarea>
        </div>
      </div>
      <div class="ipane" id="ipane-upload">
        <div class="safety-gate" style="margin-bottom:10px">Allowed: txt, log, ps1, bat, cmd, sh, py, js, vbs, php, rb, pl, conf, json, xml, ini, csv, yar. Blocked: exe, dll, bin, com, msi, sys, scr, jar, iso, img, docm, xlsm, zip, 7z, rar. <strong>Local browser analysis only.</strong></div>
        <div class="drop-zone" id="drop-zone">
          <div class="drop-icon">&#8679;</div>
          <div class="drop-txt">Drop a text file here or click to browse</div>
          <div class="drop-sub">Read as text only &middot; never executed &middot; never uploaded</div>
        </div>
        <div class="file-loaded" id="file-loaded" style="display:none"></div>
        <div class="file-blocked" id="file-blocked" style="display:none"></div>
        <input type="file" id="file-input" style="display:none" />
      </div>
      <div class="ipane" id="ipane-url">
        <div style="font-size:10px;color:var(--text3);font-family:var(--term);margin-bottom:6px">IOC LOOKUP — paste an indicator; it becomes the analysis input and renders safe pivot links.</div>
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
      </div>
    </div>

    <!-- SCORE + STATIC -->
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="panel" id="score-panel" data-section="score" style="display:none">
        <div class="panel-head"><div class="dot dot-red"></div>Threat Score</div>
        <div class="panel-body">
          <div class="score-wrap">
            <div class="score-big" id="score-num" style="color:var(--red)">00</div>
            <div class="score-meta">
              <div class="score-label">Composite Threat Score / 100</div>
              <div class="score-bar-outer"><div class="score-bar-inner" id="score-bar" style="width:0%"></div></div>
              <div id="verdict-wrap"></div>
            </div>
          </div>
          <div id="score-breakdown" style="font-size:10px;color:var(--text3);font-family:var(--term);line-height:1.8"></div>
        </div>
      </div>
      <div class="panel" id="static-panel" data-section="static" style="display:none">
        <div class="panel-head"><div class="dot dot-green"></div>Static Analysis — Hashes &amp; Metadata</div>
        <div class="panel-body" id="static-body"></div>
      </div>
    </div>
  </div>

  <div class="spinner" id="spinner"><div class="spin-dot"></div><span id="spinner-txt">Initializing engines...</span></div>

  <!-- RESULTS -->
  <div class="results-wrap" id="results-wrap">
    <div class="analyzer-grid" style="margin-bottom:16px">
      <div class="panel" data-section="ioc">
        <div class="panel-head"><div class="dot dot-red"></div>IOC Extraction<span id="ioc-total" style="margin-left:auto;font-size:10px;color:var(--text3)"></span></div>
        <div class="panel-body" id="ioc-body"></div>
      </div>
      <div class="panel" data-section="behavior">
        <div class="panel-head"><div class="dot dot-orange"></div>Behavioral Indicators<span id="beh-total" style="margin-left:auto;font-size:10px;color:var(--text3)"></span></div>
        <div class="panel-body" id="beh-body"></div>
      </div>
    </div>

    <div class="analyzer-grid" style="margin-bottom:16px">
      <div class="panel" data-section="entropy">
        <div class="panel-head"><div class="dot dot-yellow"></div>Shannon Entropy Analysis</div>
        <div class="panel-body" id="entropy-body"></div>
      </div>
      <div class="panel" data-section="strings">
        <div class="panel-head"><div class="dot dot-blue"></div>Extracted Strings Classification</div>
        <div class="panel-body" id="strings-body" style="max-height:220px;overflow-y:auto"></div>
      </div>
    </div>

    <div class="analyzer-grid" style="margin-bottom:16px">
      <div class="panel" data-section="yara">
        <div class="panel-head"><div class="dot dot-orange"></div>YARA-style local regex rules<span id="yara-total" style="margin-left:auto;font-size:10px;color:var(--text3)"></span></div>
        <div class="panel-body" id="yara-body"></div>
      </div>
      <div class="panel" data-section="mitre">
        <div class="panel-head"><div class="dot dot-purple"></div>MITRE ATT&amp;CK Mapping</div>
        <div class="panel-body" id="mitre-body"></div>
      </div>
    </div>

    <div class="analyzer-grid" style="margin-bottom:16px">
      <div class="panel" data-section="capabilities">
        <div class="panel-head"><div class="dot dot-blue"></div>Capabilities &amp; Malware Type</div>
        <div class="panel-body" id="capabilities-body"></div>
      </div>
      <div class="panel" data-section="recommendations">
        <div class="panel-head"><div class="dot dot-green"></div>Recommended Next Steps</div>
        <div class="panel-body" id="recommendations-body"></div>
      </div>
    </div>

    <div class="analyzer-grid" style="margin-bottom:16px">
      <div class="panel" data-section="deobf">
        <div class="panel-head"><div class="dot dot-blue"></div>Deobfuscated Content (inert — never executed)</div>
        <div class="panel-body" id="deobf-body"></div>
      </div>
    </div>

    <div class="panel" data-section="report" style="margin-bottom:16px">
      <div class="panel-head"><div class="dot dot-green"></div>Local Analyst Report
        <span style="margin-left:6px;font-size:9px;color:var(--text3)">[Local rules engine &middot; FOR610/GREM-style structure &middot; no AI, no cloud]</span>
        <span style="margin-left:auto;font-size:9px;color:var(--green)">Offline only</span>
      </div>
      <div class="panel-body"><div class="ai-streaming" id="ai-text"></div></div>
      <div class="export-row" id="export-row" style="display:none">
        <button class="btn-export" id="exp-json">&#8659; JSON Report</button>
        <button class="btn-export" id="exp-md">&#8659; Markdown Report</button>
        <button class="btn-export" id="exp-yara">&#8659; YARA Rules</button>
        <button class="btn-export" id="exp-copyioc">&#10697; Copy IOCs</button>
        <button class="btn-export" id="exp-copyreport">&#10697; Copy Report</button>
      </div>
    </div>

    <!-- ===== Optional Threat Intel Enrichment (off by default, manual only) ===== -->
    <div class="panel" data-section="enrich" id="enrich-panel" style="margin-bottom:16px;display:none">
      <div class="panel-head"><div class="dot dot-blue"></div>Threat Intel Enrichment
        <span style="margin-left:6px;font-size:9px;color:var(--text3)">[optional &middot; third-party data]</span>
        <button class="btn-export" id="btn-enrich" style="margin-left:auto">&#8635; Enrich IOCs</button>
      </div>
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
  <div class="page-sub">Educational summaries of malware families compiled from public threat reporting. Reference only &mdash; the analyzer does not attribute analyzed samples to any of these families or actors.</div>
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
  <div class="page-title">Free Sandbox Directory</div>
  <div class="page-sub">External dynamic-analysis platforms. These links only open when you click them — nothing is auto-fetched.</div>
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
      <p>Full threat model and hardening details: see <code>docs/security.md</code> in the repository.</p>
    </div></div>
  </div>
</div>

<!-- ============ ABOUT ============ -->
<div class="page" id="page-about">
  <div class="page-title">About ThreatRecon</div>
  <div class="page-sub">A free, browser-based malware triage and threat-intelligence workbench.</div>
  <div class="prose">
    <div class="panel"><div class="panel-body">
      <p><strong>ThreatRecon Malware Triage Workbench</strong> is a static, client-side tool for fast first-pass triage of suspicious scripts, logs, and indicators. It performs static analysis, IOC extraction, behavior mapping, YARA-style matching, deobfuscation, MITRE ATT&amp;CK mapping, and analyst report generation — entirely in your browser, with zero recurring cost and no external dependencies at runtime.</p>
      <h3 style="margin-top:14px">Why static + browser-only?</h3>
      <p>Keeping everything client-side means there is no server to attack, no sample storage to leak, and no API bills. The smallest attack surface is the one that never executes the sample and never phones home.</p>
      <h3 style="margin-top:14px">Limitations</h3>
      <p>Static heuristics cannot observe runtime behavior, unpack encrypted payloads, resolve dynamically built strings, or attribute threat actors with confidence. Always validate findings with a dedicated dynamic sandbox.</p>
      <h3 style="margin-top:14px">Source</h3>
      <p>Open source and deployable to any static host. See the repository <code>README.md</code> for deployment and the security model.</p>
    </div></div>
  </div>
</div>

<footer class="site-footer">
  <div class="footer-inner">
    <div>
      <div class="footer-brand">ThreatRecon.io</div>
      <div class="footer-meta">Static analysis only &middot; No cloud sample upload &middot; No detonation &middot; No API cost</div>
    </div>
    <div class="footer-links">
      <a data-nav="analyzer" href="#analyzer">Analyzer</a>
      <a data-nav="security" href="#security">Security</a>
      <a data-nav="about" href="#about">About</a>
      <a href="https://github.com/ThreatRec0n/threatrecon-site" target="_blank" rel="noopener noreferrer">GitHub</a>
    </div>
  </div>
</footer>

<div class="toast" id="toast"></div>
`;

export default function Page() {
  return <div id="tr-root" dangerouslySetInnerHTML={{ __html: BODY }} />;
}
