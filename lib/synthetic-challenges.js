/**
 * Synthetic challenge packet generator
 * Creates realistic packet captures for learning scenarios
 */

const LEVELS = {
  beginner: { count: 20, complexity: 1 },
  intermediate: { count: 50, complexity: 2 },
  advanced: { count: 200, complexity: 3 },
};

/**
 * Generate a challenge scenario
 */
export function generateChallenge(level = 'beginner') {
  const config = LEVELS[level] || LEVELS.beginner;
  const scenarioType = getRandomScenario();
  
  const { packets, evidencePacketId, metadata } = scenarioType.generator(config);
  
  return {
    packets,
    evidencePacketId,
    scenario: {
      title: scenarioType.title,
      description: scenarioType.description(metadata),
      hints: scenarioType.hints,
      explanation: scenarioType.explanation(metadata),
    },
    metadata,
    level,
  };
}

/**
 * Get random scenario type
 */
function getRandomScenario() {
  const scenarios = [
    dataExfiltrationScenario,
    credentialLeakScenario,
    dnsTunnelingScenario,
    fileTransferScenario,
    audioExfiltrationScenario,
    commandAndControlScenario,
    portScanScenario,
    suspiciousDownloadScenario,
  ];
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

/**
 * Generate random IP addresses
 */
function randomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

function randomPort() {
  return Math.floor(Math.random() * 60000) + 1024;
}

/**
 * Scenario: Data Exfiltration
 */
const dataExfiltrationScenario = {
  title: 'Data Exfiltration',
  description: (meta) => `An insider is exfiltrating sensitive data to external IP ${meta.targetIp}. Find the HTTP POST packet containing the file "${meta.filename}".`,
  hints: [
    'Filter by HTTP protocol: proto==HTTP',
    (meta) => `Filter by destination IP: ip.dst==${meta.targetIp}`,
    'Look for POST requests with large payloads',
  ],
  explanation: (meta) => `The evidence packet shows an HTTP POST to ${meta.targetIp} with multipart/form-data containing ${meta.filename}. This is a common exfiltration method.`,
  generator: (config) => {
    const targetIp = randomIP();
    const srcIp = `192.168.1.${Math.floor(Math.random() * 50) + 100}`;
    const filename = `confidential_${Date.now()}.xlsx`;
    const packets = [];
    const baseTime = Date.now() - 300000;

    // Normal traffic
    for (let i = 0; i < config.count - 5; i++) {
      const dstIp = randomIP();
      const srcPort = randomPort();
      const dstPort = 80 + (i % 3);
      const isTCP = i % 3 === 0;
      const ts = baseTime + i * 5000;
      const raw = new Array(500).fill(0).map(() => Math.floor(Math.random() * 256));
      
      packets.push({
        id: `pkt-${i}`,
        ts,
      tsISO: (await import('./safe-time')).safeIso(ts),
        src: `${srcIp}:${srcPort}`,
        dst: `${dstIp}:${dstPort}`,
        proto: isTCP ? 'TCP' : 'UDP',
        length: 500 + Math.floor(Math.random() * 1000),
        summary: `Normal traffic ${srcIp} → ${dstIp}`,
        raw,
        layers: {
          eth: { dstMac: '00:00:00:00:00:00', srcMac: '00:00:00:00:00:00', etherType: 0x0800 },
          ip: { version: 4, srcIp, dstIp, protocol: isTCP ? 6 : 17, protocolName: isTCP ? 'TCP' : 'UDP' },
          ...(isTCP ? {
            tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'ACK' },
          } : {
            udp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}` },
          }),
        },
        payloadHex: raw.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(raw.slice(0, 100))),
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
      });
    }

    // Evidence packet - HTTP POST with file
    const evidenceId = `pkt-evidence-${config.count}`;
    const evidencePort = randomPort();
    const evidencePayload = `POST /upload HTTP/1.1\r\nHost: ${targetIp}\r\nContent-Type: multipart/form-data; boundary=----WebKitFormBoundary\r\nContent-Length: 2048\r\n\r\n------WebKitFormBoundary\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n[FILE DATA HERE]`;
    const evidenceBytes = new TextEncoder().encode(evidencePayload);
    const evidenceTs = baseTime + config.count * 5000;

    packets.push({
      id: evidenceId,
      ts: evidenceTs,
      tsISO: (await import('./safe-time')).safeIso(evidenceTs),
      src: `${srcIp}:${evidencePort}`,
      dst: `${targetIp}:80`,
      proto: 'HTTP',
      length: evidenceBytes.length + 100,
      summary: `HTTP POST ${srcIp} → ${targetIp}:80`,
      raw: Array.from(evidenceBytes),
      layers: {
        eth: { dstMac: '00:00:00:00:00:00', srcMac: '00:00:00:00:00:00', etherType: 0x0800 },
        ip: { version: 4, srcIp, dstIp: targetIp, protocol: 6, protocolName: 'TCP' },
        tcp: { srcPort: evidencePort, dstPort: 80, src: `${srcIp}:${evidencePort}`, dst: `${targetIp}:80`, flags: 'ACK' },
        http: {
          method: 'POST',
          url: '/upload',
          host: targetIp,
          summary: `POST /upload HTTP/1.1 (${filename})`,
        },
      },
      tcp: {
        src: `${srcIp}:${evidencePort}`,
        dst: `${targetIp}:80`,
      },
      http: {
        method: 'POST',
        url: '/upload',
        summary: `POST /upload HTTP/1.1 (${filename})`,
      },
      evidence: {
        type: 'file_exfiltration',
        filename,
        targetIp,
      },
      payloadHex: Array.from(evidenceBytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
      payloadAscii: new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(evidenceBytes)),
      fiveTupleKey: `${srcIp}:${evidencePort} -> ${targetIp}:80`,
    });

    return {
      packets: packets.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      evidencePacketId: evidenceId,
      metadata: { targetIp, filename, srcIp },
    };
  },
};

/**
 * Scenario: Credential Leak
 */
const credentialLeakScenario = {
  title: 'Credential Theft',
  description: (meta) => `Credentials are being sent in plaintext HTTP. Find the packet containing username "${meta.username}" and password.`,
  hints: [
    'Filter HTTP traffic: proto==HTTP',
    'Look for POST requests to login endpoints',
    'Search payload for username patterns',
  ],
  explanation: (meta) => `The packet shows an HTTP POST to /login with credentials in the URL or body. Always use HTTPS for authentication.`,
  generator: (config) => {
    const targetIp = randomIP();
    const srcIp = `192.168.1.${Math.floor(Math.random() * 50) + 100}`;
    const username = `admin${Math.floor(Math.random() * 1000)}`;
    const password = `p@ssw0rd${Math.floor(Math.random() * 100)}`;
    const packets = [];
    const baseTime = Date.now() - 300000;

    for (let i = 0; i < config.count - 3; i++) {
      packets.push({
        id: `pkt-${i}`,
        ts: (await import('./safe-time')).safeIso(baseTime + i * 5000),
        src: `${srcIp}:${randomPort()}`,
        dst: `${randomIP()}:80`,
        proto: 'HTTP',
        length: 400 + Math.floor(Math.random() * 200),
        summary: `HTTP GET ${srcIp} → ${randomIP()}:80`,
        raw: new Array(400).fill(0).map(() => Math.floor(Math.random() * 256)),
      });
    }

    const evidenceId = `pkt-evidence-${config.count}`;
    const evidencePayload = `POST /login HTTP/1.1\r\nHost: ${targetIp}\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nusername=${username}&password=${password}`;
    const evidenceBytes = new TextEncoder().encode(evidencePayload);

    packets.push({
      id: evidenceId,
      ts: (await import('./safe-time')).safeIso(baseTime + config.count * 5000),
      src: `${srcIp}:${randomPort()}`,
      dst: `${targetIp}:80`,
      proto: 'HTTP',
      length: evidenceBytes.length + 100,
      summary: `HTTP POST ${srcIp} → ${targetIp}:80 /login`,
      raw: Array.from(evidenceBytes),
      http: {
        method: 'POST',
        url: `/login?username=${username}&password=${password}`,
        summary: `POST /login (credentials)`,
      },
      evidence: {
        type: 'credential_leak',
        username,
        password,
        targetIp,
      },
    });

    return {
      packets: packets.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      evidencePacketId: evidenceId,
      metadata: { username, password, targetIp, srcIp },
    };
  },
};

/**
 * Scenario: DNS Tunneling
 */
const dnsTunnelingScenario = {
  title: 'DNS Tunneling',
  description: (meta) => `An attacker is using DNS queries to exfiltrate data. Find the DNS query packet containing base64-encoded data (look for unusually long domain names).`,
  hints: [
    'Filter DNS traffic: proto==DNS',
    'Look for DNS queries (not responses)',
    'Check for abnormally long domain names or base64 patterns',
  ],
  explanation: (meta) => `The DNS query contains base64-encoded data in the subdomain. DNS tunneling is a common data exfiltration method that bypasses firewalls.`,
  generator: (config) => {
    const srcIp = `192.168.1.${Math.floor(Math.random() * 50) + 100}`;
    const dnsServer = '8.8.8.8';
    const encodedData = btoa('SECRET_DATA_' + Date.now()).substring(0, 40);
    const packets = [];
    const baseTime = Date.now() - 300000;

    for (let i = 0; i < config.count - 5; i++) {
      packets.push({
        id: `pkt-${i}`,
        ts: (await import('./safe-time')).safeIso(baseTime + i * 3000),
        src: `${srcIp}:${randomPort()}`,
        dst: `${randomIP()}:80`,
        proto: 'HTTP',
        length: 500 + Math.floor(Math.random() * 300),
        summary: `HTTP GET ${srcIp} → ${randomIP()}:80`,
        raw: new Array(500).fill(0).map(() => Math.floor(Math.random() * 256)),
      });
    }

    const evidenceId = `pkt-evidence-${config.count}`;
    const suspiciousDomain = `${encodedData}.exfil.example.com`;
    
    packets.push({
      id: evidenceId,
      ts: (await import('./safe-time')).safeIso(baseTime + config.count * 3000),
      src: `${srcIp}:${randomPort()}`,
      dst: `${dnsServer}:53`,
      proto: 'DNS',
      length: 150 + encodedData.length,
      summary: `DNS query: ${suspiciousDomain.substring(0, 40)}...`,
      raw: new Array(150 + encodedData.length).fill(0).map(() => Math.floor(Math.random() * 256)),
      dns: {
        query: suspiciousDomain,
        summary: `DNS query: ${suspiciousDomain}`,
      },
      evidence: {
        type: 'dns_tunneling',
        domain: suspiciousDomain,
        encodedData,
      },
    });

    return {
      packets: packets.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      evidencePacketId: evidenceId,
      metadata: { suspiciousDomain, encodedData, srcIp },
    };
  },
};

/**
 * Additional scenario generators (simplified versions)
 */
const fileTransferScenario = {
  title: 'Suspicious File Transfer',
  description: (meta) => `A suspicious file transfer occurred. Find the packet containing "${meta.filename}".`,
  hints: ['Filter HTTP traffic', 'Look for GET requests with file extensions', 'Check Content-Type headers'],
  explanation: (meta) => `The file ${meta.filename} was transferred via HTTP. Analyze the payload for malicious content.`,
  generator: (config) => dataExfiltrationScenario.generator(config),
};

const audioExfiltrationScenario = {
  title: 'Audio Exfiltration',
  description: () => `VoIP audio data is being sent to an external server. Find the RTP packet containing audio payload.`,
  hints: ['Filter UDP traffic', 'Look for packets to port 5060 or RTP ports (16384+)', 'Check for audio codec headers'],
  explanation: () => `The RTP packet contains G.711 audio encoding. VoIP can be used for data exfiltration.`,
  generator: (config) => {
    const targetIp = randomIP();
    const srcIp = `192.168.1.${Math.floor(Math.random() * 50) + 100}`;
    const packets = [];
    const baseTime = Date.now() - 300000;

    for (let i = 0; i < config.count - 1; i++) {
      packets.push({
        id: `pkt-${i}`,
        ts: (await import('./safe-time')).safeIso(baseTime + i * 20000),
        src: `${srcIp}:${randomPort()}`,
        dst: `${randomIP()}:80`,
        proto: 'UDP',
        length: 200 + Math.floor(Math.random() * 100),
        summary: `UDP ${srcIp} → ${randomIP()}`,
        raw: new Array(200).fill(0).map(() => Math.floor(Math.random() * 256)),
      });
    }

    const evidenceId = `pkt-evidence-${config.count}`;
    packets.push({
      id: evidenceId,
      ts: (await import('./safe-time')).safeIso(baseTime + config.count * 20000),
      src: `${srcIp}:16384`,
      dst: `${targetIp}:16384`,
      proto: 'RTP',
      length: 160,
      summary: `RTP ${srcIp}:16384 → ${targetIp}:16384 (G.711)`,
      raw: new Array(160).fill(0).map(() => Math.floor(Math.random() * 256)),
      evidence: { type: 'audio_exfiltration', targetIp },
    });

    return {
      packets: packets.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      evidencePacketId: evidenceId,
      metadata: { targetIp, srcIp },
    };
  },
};

const commandAndControlScenario = {
  title: 'C2 Beacon',
  description: (meta) => `A compromised host is beaconing to C2 server ${meta.c2Ip}. Find the periodic TCP SYN packet.`,
  hints: ['Filter TCP traffic', `Look for repeated connections to ${(meta) => meta.c2Ip}`, 'Check for regular time intervals'],
  explanation: (meta) => `The host is beaconing to ${meta.c2Ip} every 60 seconds. This is characteristic of malware C2 communication.`,
  generator: (config) => {
    const c2Ip = randomIP();
    const srcIp = `192.168.1.${Math.floor(Math.random() * 50) + 100}`;
    const packets = [];
    const baseTime = Date.now() - 3600000;

    for (let i = 0; i < config.count; i++) {
      const isBeacon = i % 10 === 0;
      packets.push({
        id: `pkt-${i}`,
        ts: (await import('./safe-time')).safeIso(baseTime + i * 6000),
        src: isBeacon ? `${srcIp}:${randomPort()}` : `${srcIp}:${randomPort()}`,
        dst: isBeacon ? `${c2Ip}:443` : `${randomIP()}:80`,
        proto: 'TCP',
        length: isBeacon ? 74 : 500 + Math.floor(Math.random() * 200),
        summary: isBeacon ? `TCP ${srcIp} → ${c2Ip}:443 [SYN]` : `TCP ${srcIp} → ${randomIP()}:80`,
        raw: new Array(isBeacon ? 74 : 500).fill(0).map(() => Math.floor(Math.random() * 256)),
        evidence: isBeacon ? { type: 'c2_beacon', c2Ip, srcIp } : undefined,
      });
    }

    const evidencePackets = packets.filter(p => p.evidence);
    return {
      packets: packets.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      evidencePacketId: evidencePackets[0]?.id,
      metadata: { c2Ip, srcIp },
    };
  },
};

const portScanScenario = {
  title: 'Port Scanning',
  description: () => `An attacker is performing a port scan. Find the SYN packets targeting multiple ports on the same host.`,
  hints: ['Filter TCP SYN packets', 'Group by destination IP', 'Look for rapid sequential port connections'],
  explanation: () => `Multiple TCP SYN packets to consecutive ports indicate a port scan. This is reconnaissance activity.`,
  generator: (config) => {
    const targetIp = randomIP();
    const attackerIp = `192.168.1.${Math.floor(Math.random() * 50) + 100}`;
    const packets = [];
    const baseTime = Date.now() - 60000;

    for (let i = 0; i < config.count; i++) {
      const isScan = i < 20;
      packets.push({
        id: `pkt-${i}`,
        ts: (await import('./safe-time')).safeIso(baseTime + i * 100),
        src: `${attackerIp}:${randomPort()}`,
        dst: isScan ? `${targetIp}:${8000 + i}` : `${randomIP()}:80`,
        proto: 'TCP',
        length: isScan ? 74 : 500,
        summary: isScan ? `TCP ${attackerIp} → ${targetIp}:${8000 + i} [SYN]` : `TCP ${attackerIp} → ${randomIP()}:80`,
        raw: new Array(isScan ? 74 : 500).fill(0).map(() => Math.floor(Math.random() * 256)),
        evidence: isScan ? { type: 'port_scan', targetIp, attackerIp } : undefined,
      });
    }

    return {
      packets: packets.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      evidencePacketId: packets.find(p => p.evidence)?.id,
      metadata: { targetIp, attackerIp },
    };
  },
};

const suspiciousDownloadScenario = {
  title: 'Malicious Download',
  description: (meta) => `A suspicious file is being downloaded. Find the HTTP GET response containing "${meta.filename}".`,
  hints: ['Filter HTTP responses', 'Look for Content-Type: application/x-executable', 'Check file extensions'],
  explanation: (meta) => `The HTTP response contains ${meta.filename}, likely malware. Always verify downloads from untrusted sources.`,
  generator: (config) => {
    const srcIp = randomIP();
    const targetIp = `192.168.1.${Math.floor(Math.random() * 50) + 100}`;
    const filename = `malware_${Date.now()}.exe`;
    const packets = [];
    const baseTime = Date.now() - 300000;

    for (let i = 0; i < config.count - 2; i++) {
      packets.push({
        id: `pkt-${i}`,
        ts: (await import('./safe-time')).safeIso(baseTime + i * 5000),
        src: `${randomIP()}:80`,
        dst: `${targetIp}:${randomPort()}`,
        proto: 'HTTP',
        length: 800 + Math.floor(Math.random() * 400),
        summary: `HTTP response`,
        raw: new Array(800).fill(0).map(() => Math.floor(Math.random() * 256)),
      });
    }

    const evidenceId = `pkt-evidence-${config.count}`;
    const evidencePayload = `HTTP/1.1 200 OK\r\nContent-Type: application/x-executable\r\nContent-Disposition: attachment; filename="${filename}"\r\n\r\n[MZ...PE HEADER...]`;
    const evidenceBytes = new TextEncoder().encode(evidencePayload);

    packets.push({
      id: evidenceId,
      ts: (await import('./safe-time')).safeIso(baseTime + config.count * 5000),
      src: `${srcIp}:80`,
      dst: `${targetIp}:${randomPort()}`,
      proto: 'HTTP',
      length: evidenceBytes.length + 100,
      summary: `HTTP 200 ${srcIp}:80 → ${targetIp} (${filename})`,
      raw: Array.from(evidenceBytes),
      http: {
        method: 'GET',
        url: `/${filename}`,
        summary: `HTTP 200 OK (${filename})`,
      },
      evidence: {
        type: 'malicious_download',
        filename,
        srcIp,
      },
    });

    return {
      packets: packets.sort((a, b) => new Date(a.ts) - new Date(b.ts)),
      evidencePacketId: evidenceId,
      metadata: { filename, srcIp, targetIp },
    };
  },
};

