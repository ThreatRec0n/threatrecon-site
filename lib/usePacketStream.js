import { useState, useEffect, useRef, useCallback } from 'react';
import { safeIso } from './safe-time';

/**
 * Realistic IP/domain/filename generators
 */
const randomInternalIP = () => {
  const ranges = [
    () => `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    () => `172.${Math.floor(Math.random() * 16) + 16}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    () => `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
  ];
  return ranges[Math.floor(Math.random() * ranges.length)]();
};

const randomExternalIP = () => {
  // Mix of realistic ranges: AWS, GCP, Azure-like, consumer ISPs
  const patterns = [
    () => `8.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    () => `13.${Math.floor(Math.random() * 100)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    () => `52.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    () => `104.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    () => `142.250.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    () => `${Math.floor(Math.random() * 220) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
  ];
  return patterns[Math.floor(Math.random() * patterns.length)]();
};

const realisticDomain = (type = 'good') => {
  if (type === 'bad') {
    const bads = [
      `cdn-dropbox-login${Math.floor(Math.random() * 100)}.pw`,
      `payroll-sync-backup${Math.floor(Math.random() * 100)}.top`,
      `office365-verify${Math.floor(Math.random() * 100)}.link`,
      `data-backup${Math.floor(Math.random() * 1000)}.xyz`,
    ];
    return bads[Math.floor(Math.random() * bads.length)];
  }
  const goods = [
    'microsoft-update.example',
    'drive-sync.internal',
    'zoom-cdn.example',
    'update-windows.internal',
    'office365-auth.example',
  ];
  return goods[Math.floor(Math.random() * goods.length)];
};

const realisticFilename = (type = 'normal') => {
  if (type === 'sensitive') {
    const sensitive = [
      `payroll_q${Math.floor(Math.random() * 4) + 1}.xlsx`,
      `clients_export_${new Date().getFullYear()}.csv`,
      `voice_call_${new Date().toISOString().slice(0, 10)}.raw`,
      `confidential_${Date.now()}.pdf`,
      `creds.txt`,
    ];
    return sensitive[Math.floor(Math.random() * sensitive.length)];
  } else if (type === 'malicious') {
    return `malware_dropper_${Date.now()}.exe`;
  }
  return `document_${Math.floor(Math.random() * 1000)}.pdf`;
};

/**
 * Generate packet based on profile type
 */
function generatePacketForProfile(profileType, difficulty, packetIndex, evidencePacketIndex) {
  const ts = Date.now() + packetIndex * 200;
  const srcIp = randomInternalIP();
  const dstIp = profileType.includes('lateral') ? randomInternalIP() : randomExternalIP();
  const isEvidence = packetIndex === evidencePacketIndex;
  
  let packet = {
    id: `pkt-${ts}-${Math.random().toString(36).substr(2, 9)}`,
    ts,
    tsISO: safeIso(ts),
    raw: [],
    layers: {
      eth: { dstMac: '00:00:00:00:00:00', srcMac: '00:00:00:00:00:00', etherType: 0x0800 },
      ip: { version: 4, srcIp, dstIp, protocol: 6, protocolName: 'TCP' },
    },
    evidence: isEvidence,
    explanation: '',
    teachable: [],
  };

  // HTTP Exfiltration
  if (profileType === 'http-exfil') {
    const srcPort = Math.floor(Math.random() * 60000) + 1024;
    const dstPort = 80;
    const filename = isEvidence ? realisticFilename('sensitive') : realisticFilename();
    
    if (isEvidence || (difficulty === 'beginner' && packetIndex % 10 === 0)) {
      const payload = `POST /upload HTTP/1.1\r\nHost: ${dstIp}\r\nContent-Type: multipart/form-data; boundary=----WebKitFormBoundary\r\nContent-Length: 2048\r\n\r\n------WebKitFormBoundary\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n\r\n[DATA]`;
      const bytes = new TextEncoder().encode(payload);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${dstIp}:${dstPort}`,
        proto: 'HTTP',
        length: bytes.length + 100,
        summary: `HTTP POST ${srcIp}:${srcPort} → ${dstIp}:${dstPort} /upload`,
        raw: Array.from(bytes),
        layers: {
          ...packet.layers,
          tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'PSH ACK' },
          http: {
            method: 'POST',
            url: '/upload',
            host: dstIp,
            userAgent: 'Mozilla/5.0',
            contentType: 'multipart/form-data',
            summary: `POST /upload (${filename})`,
          },
        },
        payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes)),
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
        explanation: isEvidence ? `This POST uploads ${filename} to ${dstIp}. Evidence of data exfiltration.` : '',
        teachable: isEvidence ? ['Exfiltration via HTTP POST', 'Suspicious external IP', 'Sensitive filename in cleartext'] : [],
      };
    } else {
      // Normal HTTP traffic
      const methods = ['GET', 'GET', 'GET', 'POST'];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const payload = `${method} / HTTP/1.1\r\nHost: ${realisticDomain()}\r\nUser-Agent: Mozilla/5.0\r\n\r\n`;
      const bytes = new TextEncoder().encode(payload);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${dstIp}:${dstPort}`,
        proto: 'HTTP',
        length: bytes.length + 100,
        summary: `HTTP ${method} ${srcIp}:${srcPort} → ${dstIp}:${dstPort}`,
        raw: Array.from(bytes),
        layers: {
          ...packet.layers,
          tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'ACK' },
          http: { method, url: '/', host: realisticDomain(), userAgent: 'Mozilla/5.0' },
        },
        payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes)),
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
      };
    }
  }
  // DNS Exfiltration
  else if (profileType === 'dns-exfil') {
    const srcPort = Math.floor(Math.random() * 60000) + 1024;
    const dstPort = 53;
    const dnsServer = '8.8.8.8';
    
    if (isEvidence || (difficulty === 'beginner' && packetIndex % 15 === 0)) {
      const encoded = btoa(`SECRET_${Date.now()}`).substring(0, 40);
      const suspiciousDomain = `${encoded}.exfil.example.com`;
      const payload = new TextEncoder().encode(`DNS query: ${suspiciousDomain}`);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${dnsServer}:${dstPort}`,
        proto: 'DNS',
        length: 150 + encoded.length,
        summary: `DNS query: ${suspiciousDomain.substring(0, 50)}...`,
        raw: Array.from(payload),
        layers: {
          ...packet.layers,
          udp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dnsServer}:${dstPort}` },
          dns: { query: suspiciousDomain, type: 'TXT', id: Math.floor(Math.random() * 65535), summary: `DNS query: ${suspiciousDomain}` },
        },
        payloadHex: Array.from(payload.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: suspiciousDomain,
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dnsServer}:${dstPort}`,
        explanation: isEvidence ? `DNS query contains base64-encoded data in subdomain. DNS tunneling detected.` : '',
        teachable: isEvidence ? ['DNS tunneling', 'Base64 encoding in subdomain', 'Abnormally long domain name'] : [],
      };
    } else {
      const normalDomain = realisticDomain();
      const payload = new TextEncoder().encode(`DNS query: ${normalDomain}`);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${dnsServer}:${dstPort}`,
        proto: 'DNS',
        length: 100,
        summary: `DNS query: ${normalDomain}`,
        raw: Array.from(payload),
        layers: {
          ...packet.layers,
          protocol: 17,
          protocolName: 'UDP',
          udp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dnsServer}:${dstPort}` },
          dns: { query: normalDomain, type: 'A', id: Math.floor(Math.random() * 65535), summary: `DNS query: ${normalDomain}` },
        },
        payloadHex: Array.from(payload.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: normalDomain,
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dnsServer}:${dstPort}`,
      };
      packet.layers.ip.protocol = 17;
      packet.layers.ip.protocolName = 'UDP';
    }
  }
  // Credential Theft
  else if (profileType === 'credential-theft') {
    const srcPort = Math.floor(Math.random() * 60000) + 1024;
    const useSMTP = packetIndex % 2 === 0; // Alternate between HTTP and SMTP
    const dstPort = useSMTP ? 25 : 80;
    
    if (isEvidence || (difficulty === 'beginner' && packetIndex % 12 === 0)) {
      const username = `admin${Math.floor(Math.random() * 1000)}`;
      const password = `p@ssw0rd${Math.floor(Math.random() * 100)}`;
      const creds = btoa(`${username}:${password}`);
      
      if (useSMTP && isEvidence) {
        // SMTP AUTH PLAIN
        const payload = `AUTH PLAIN ${creds}\r\n`;
        const bytes = new TextEncoder().encode(payload);
        packet = {
          ...packet,
          src: `${srcIp}:${srcPort}`,
          dst: `${dstIp}:${dstPort}`,
          proto: 'SMTP',
          length: bytes.length + 100,
          summary: `SMTP AUTH ${srcIp}:${srcPort} → ${dstIp}:${dstPort}`,
          raw: Array.from(bytes),
          layers: {
            ...packet.layers,
            tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'PSH ACK' },
            smtp: {
              command: 'AUTH PLAIN',
              credential: creds,
            },
          },
          payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
          payloadAscii: new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes)),
          fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
          explanation: isEvidence ? `SMTP AUTH PLAIN contains base64-encoded credentials (username:password).` : '',
          teachable: isEvidence ? ['Plaintext credential transmission', 'SMTP AUTH PLAIN weakness', 'Credentials in base64'] : [],
        };
      } else {
        // HTTP Basic Auth
        const payload = `POST /login HTTP/1.1\r\nHost: ${dstIp}\r\nAuthorization: Basic ${creds}\r\nContent-Type: application/x-www-form-urlencoded\r\n\r\nusername=${username}&password=${password}`;
        const bytes = new TextEncoder().encode(payload);
        packet = {
          ...packet,
          src: `${srcIp}:${srcPort}`,
          dst: `${dstIp}:${dstPort}`,
          proto: 'HTTP',
          length: bytes.length + 100,
          summary: `HTTP POST ${srcIp}:${srcPort} → ${dstIp}:${dstPort} /login`,
          raw: Array.from(bytes),
          layers: {
            ...packet.layers,
            tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'PSH ACK' },
            http: {
              method: 'POST',
              url: '/login',
              host: dstIp,
              authorization: `Basic ${creds}`,
              summary: `POST /login (credentials)`,
            },
          },
          payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
          payloadAscii: new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes)),
          fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
          explanation: isEvidence ? `HTTP POST contains plaintext credentials (username/password) in Authorization header and body.` : '',
          teachable: isEvidence ? ['Plaintext credential transmission', 'HTTP Basic Auth weakness', 'Credentials in POST body'] : [],
        };
      }
    } else {
      // Normal HTTP
      const payload = `GET / HTTP/1.1\r\nHost: ${realisticDomain()}\r\nUser-Agent: Mozilla/5.0\r\n\r\n`;
      const bytes = new TextEncoder().encode(payload);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${dstIp}:${dstPort}`,
        proto: 'HTTP',
        length: bytes.length + 100,
        summary: `HTTP GET ${srcIp}:${srcPort} → ${dstIp}:${dstPort}`,
        raw: Array.from(bytes),
        layers: {
          ...packet.layers,
          tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'ACK' },
          http: { method: 'GET', url: '/', host: realisticDomain() },
        },
        payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes)),
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
      };
    }
  }
  // Beaconing / C2
  else if (profileType === 'beaconing') {
    const srcPort = Math.floor(Math.random() * 60000) + 1024;
    const c2Ip = randomExternalIP();
    const dstPort = difficulty === 'beginner' ? 443 : Math.floor(Math.random() * 60000) + 1024;
    
    if (isEvidence || (packetIndex % 60 === 0 && difficulty === 'beginner')) {
      // Periodic beacon
      const payload = new TextEncoder().encode(`Beacon:${Date.now()}`);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${c2Ip}:${dstPort}`,
        proto: 'TCP',
        length: 74 + payload.length,
        summary: `TCP ${srcIp}:${srcPort} → ${c2Ip}:${dstPort} [SYN/ACK]`,
        raw: Array.from(payload),
        layers: {
          ...packet.layers,
          tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${c2Ip}:${dstPort}`, flags: 'SYN ACK' },
        },
        payloadHex: Array.from(payload.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: '',
        fiveTupleKey: `${srcIp}:${srcPort} -> ${c2Ip}:${dstPort}`,
        explanation: isEvidence ? `Periodic beacon to C2 server ${c2Ip}. Consistent timing indicates automated malware communication.` : '',
        teachable: isEvidence ? ['C2 beaconing pattern', 'Regular time intervals', 'External IP communication'] : [],
      };
    } else {
      // Normal TCP
      const payload = new TextEncoder().encode(`Normal traffic`);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${randomExternalIP()}:80`,
        proto: 'TCP',
        length: 500,
        summary: `TCP ${srcIp}:${srcPort} → ${randomExternalIP()}:80`,
        raw: Array.from(payload),
        layers: {
          ...packet.layers,
          tcp: { srcPort, dstPort: 80, src: `${srcIp}:${srcPort}`, dst: `${randomExternalIP()}:80`, flags: 'ACK' },
        },
        payloadHex: Array.from(payload.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: '',
        fiveTupleKey: `${srcIp}:${srcPort} -> ${randomExternalIP()}:80`,
      };
    }
  }
  // Lateral Movement (SMB-like)
  else if (profileType === 'lateral-movement') {
    const srcPort = Math.floor(Math.random() * 60000) + 1024;
    const dstPort = 445;
    
    if (isEvidence || (difficulty === 'beginner' && packetIndex % 8 === 0)) {
      const filename = realisticFilename('sensitive');
      const payload = `SMB Copy: ${filename} from ${srcIp} to ${dstIp}`;
      const bytes = new TextEncoder().encode(payload);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${dstIp}:${dstPort}`,
        proto: 'SMB',
        length: bytes.length + 100,
        summary: `SMB ${srcIp}:${srcPort} → ${dstIp}:${dstPort} (copy ${filename})`,
        raw: Array.from(bytes),
        layers: {
          ...packet.layers,
          tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'ACK' },
          smb: { command: 'Copy', filename, summary: `SMB copy: ${filename}` },
        },
        payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: payload,
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
        explanation: isEvidence ? `SMB file copy of ${filename} from internal host to internal host. Possible lateral movement.` : '',
        teachable: isEvidence ? ['Lateral movement via SMB', 'Internal-to-internal file copy', 'Sensitive file access'] : [],
      };
    } else {
      // Normal SMB
      const payload = `SMB Read`;
      const bytes = new TextEncoder().encode(payload);
      packet = {
        ...packet,
        src: `${srcIp}:${srcPort}`,
        dst: `${dstIp}:${dstPort}`,
        proto: 'SMB',
        length: bytes.length + 100,
        summary: `SMB ${srcIp}:${srcPort} → ${dstIp}:${dstPort}`,
        raw: Array.from(bytes),
        layers: {
          ...packet.layers,
          tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'ACK' },
          smb: { command: 'Read', summary: 'SMB read' },
        },
        payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
        payloadAscii: payload,
        fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
      };
    }
  }
  // Mixed Realistic Network
  else {
    // Random protocol selection
    const protocols = ['http', 'dns', 'tcp', 'udp'];
    const proto = protocols[Math.floor(Math.random() * protocols.length)];
    
    const srcPort = Math.floor(Math.random() * 60000) + 1024;
    const dstPort = proto === 'http' ? 80 : proto === 'dns' ? 53 : Math.floor(Math.random() * 60000) + 1024;
    
    const payload = `Mixed traffic`;
    const bytes = new TextEncoder().encode(payload);
    packet = {
      ...packet,
      src: `${srcIp}:${srcPort}`,
      dst: `${dstIp}:${dstPort}`,
      proto: proto.toUpperCase(),
      length: bytes.length + 100,
      summary: `${proto.toUpperCase()} ${srcIp}:${srcPort} → ${dstIp}:${dstPort}`,
      raw: Array.from(bytes),
      layers: {
        ...packet.layers,
        protocol: proto === 'dns' ? 17 : 6,
        protocolName: proto === 'dns' ? 'UDP' : 'TCP',
        ...(proto === 'dns' ? {
          udp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}` },
          dns: { query: realisticDomain() },
        } : {
          tcp: { srcPort, dstPort, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, flags: 'ACK' },
        }),
      },
      payloadHex: Array.from(bytes.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' ') + '...',
      payloadAscii: '',
      fiveTupleKey: `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`,
    };
    packet.layers.ip.protocol = proto === 'dns' ? 17 : 6;
    packet.layers.ip.protocolName = proto === 'dns' ? 'UDP' : 'TCP';
    
    // Randomly inject evidence
    if (isEvidence) {
      packet.evidence = true;
      packet.explanation = `Evidence packet detected in mixed traffic flow.`;
      packet.teachable = ['Mixed protocol analysis', 'Pattern detection'];
    }
  }

  return packet;
}

/**
 * usePacketStream Hook
 */
export function usePacketStream(profileType, difficulty, isRunning) {
  const [packets, setPackets] = useState([]);
  const [packetIndex, setPacketIndex] = useState(0);
  const intervalRef = useRef(null);
  const evidencePacketIndexRef = useRef(null);

  // Determine evidence packet position based on difficulty
  const getEvidencePosition = useCallback(() => {
    if (!evidencePacketIndexRef.current) {
      const positions = {
        beginner: 15, // Early, obvious
        intermediate: 35,
        advanced: 75,
      };
      evidencePacketIndexRef.current = positions[difficulty] || 35;
    }
    return evidencePacketIndexRef.current;
  }, [difficulty]);

  const reset = useCallback(() => {
    setPackets([]);
    setPacketIndex(0);
    evidencePacketIndexRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (intervalRef.current) return; // Already running
    
    intervalRef.current = setInterval(() => {
      setPacketIndex(prev => {
        const newIndex = prev + 1;
        const evidencePos = getEvidencePosition();
        const newPacket = generatePacketForProfile(profileType, difficulty, newIndex, evidencePos);
        
        setPackets(prevPackets => [...prevPackets, newPacket]);
        return newIndex;
      });
    }, 200); // ~200ms per packet
  }, [profileType, difficulty, getEvidencePosition]);

  useEffect(() => {
    if (isRunning && !intervalRef.current) {
      resume();
    } else if (!isRunning && intervalRef.current) {
      pause();
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, resume, pause]);

  // Find evidence packet
  const evidencePacket = packets.find(p => p.evidence === true);

  return {
    packets,
    isRunning: !!intervalRef.current,
    pause,
    resume,
    reset,
    evidencePacket,
  };
}

