// Packet factory: builds neutral, renderable packet objects
import { uniqueId, randInt } from './random-net';

function hexFromAscii(ascii, limit = 256) {
  const enc = new TextEncoder();
  const bytes = enc.encode(ascii);
  const slice = bytes.slice(0, limit);
  return Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

function assembleBase({ no, timeEpochMs, src, dst, protocol, info, length, layers, payloadAscii }) {
  return {
    id: uniqueId('pkt'),
    no,
    timeEpochMs,
    src,
    dst,
    protocol,
    length,
    info,
    layers,
    payloadAscii: payloadAscii || '',
    payloadHex: hexFromAscii(payloadAscii || ''),
    streamKey: layers.tcp ? `${layers.ip.src}:${layers.tcp.srcPort} -> ${layers.ip.dst}:${layers.tcp.dstPort}` : (layers.udp ? `${layers.ip.src}:${layers.udp.srcPort} -> ${layers.ip.dst}:${layers.udp.dstPort}` : null),
  };
}

export function buildHTTP({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort = 80, method = 'GET', host, uri = '/', headers = {}, body = '' }) {
  const startLine = `${method} ${uri} HTTP/1.1\r\n`;
  const hdrs = { Host: host, 'User-Agent': headers['User-Agent'] || 'Mozilla/5.0', ...headers };
  const headerText = Object.entries(hdrs).map(([k, v]) => `${k}: ${v}`).join('\r\n');
  const wire = `${startLine}${headerText}\r\n\r\n${body}`;
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 64, protocolName: 'TCP', protocol: 6 },
    tcp: { srcPort, dstPort, flags: body ? 'PSH, ACK' : 'ACK', seq: randInt(1, 1e6), ack: randInt(1, 1e6) },
    http: { method, host, uri, headers: hdrs, bodyPreview: body.slice(0, 200) },
  };
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'HTTP', info: `${method} ${uri}`, length: wire.length + 66, layers, payloadAscii: wire });
}

export function buildHTTPS({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort = 443, sni, version = 'TLS 1.2' }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 64, protocolName: 'TCP', protocol: 6 },
    tcp: { srcPort, dstPort, flags: 'ACK', seq: randInt(1, 1e6), ack: randInt(1, 1e6) },
    tls: { sni, version },
  };
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'TLS', info: `Client Hello SNI=${sni}`, length: 100, layers, payloadAscii: `TLS ${version} SNI ${sni}` });
}

export function buildDNS({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort = 53, qname, qtype = 'A' }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 128, protocolName: 'UDP', protocol: 17 },
    udp: { srcPort, dstPort },
    dns: { qname, qtype, id: randInt(1, 65535) },
  };
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'DNS', info: `Standard query ${qtype} ${qname}`, length: 90, layers, payloadAscii: qname });
}

export function buildSMTP({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort = 25, cmd = 'AUTH', arg = '' }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 64, protocolName: 'TCP', protocol: 6 },
    tcp: { srcPort, dstPort, flags: 'PSH, ACK', seq: randInt(1, 1e6), ack: randInt(1, 1e6) },
    smtp: { cmd, arg },
  };
  const line = `${cmd} ${arg}`.trim();
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'SMTP', info: line, length: 80 + line.length, layers, payloadAscii: `${line}\r\n` });
}

export function buildIMAP({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort = 143, cmd = 'LOGIN', arg = '' }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 64, protocolName: 'TCP', protocol: 6 },
    tcp: { srcPort, dstPort, flags: 'PSH, ACK', seq: randInt(1, 1e6), ack: randInt(1, 1e6) },
    imap: { cmd, arg },
  };
  const line = `${cmd} ${arg}`.trim();
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'IMAP', info: line, length: 80 + line.length, layers, payloadAscii: `${line}\r\n` });
}

export function buildFTP({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort = 21, cmd = 'USER', arg = 'anonymous' }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 64, protocolName: 'TCP', protocol: 6 },
    tcp: { srcPort, dstPort, flags: 'PSH, ACK', seq: randInt(1, 1e6), ack: randInt(1, 1e6) },
    ftp: { cmd, arg },
  };
  const line = `${cmd} ${arg}`.trim();
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'FTP', info: line, length: 80 + line.length, layers, payloadAscii: `${line}\r\n` });
}

export function buildICMP({ no, timeEpochMs, srcIp, dstIp, type = 'Echo (ping) request', code = 0 }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 128, protocolName: 'ICMP', protocol: 1 },
    icmp: { type, code },
  };
  return assembleBase({ no, timeEpochMs, src: srcIp, dst: dstIp, protocol: 'ICMP', info: type, length: 74, layers, payloadAscii: '' });
}

export function buildRTP({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort, ssrc, seq, pt = 0 }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 64, protocolName: 'UDP', protocol: 17 },
    udp: { srcPort, dstPort },
    rtp: { ssrc, seq, pt },
  };
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'RTP', info: `SSRC ${ssrc} Seq ${seq}`, length: 200, layers, payloadAscii: '' });
}

export function buildSMB({ no, timeEpochMs, srcIp, dstIp, srcPort, dstPort = 445, op = 'Write', share = '\\share', path = '\\path\\file' }) {
  const layers = {
    eth: { src: '00:00:00:00:00:00', dst: 'ff:ff:ff:ff:ff:ff' },
    ip: { src: srcIp, dst: dstIp, version: 4, ttl: 128, protocolName: 'TCP', protocol: 6 },
    tcp: { srcPort, dstPort, flags: 'ACK', seq: randInt(1, 1e6), ack: randInt(1, 1e6) },
    smb: { share, path, op },
  };
  return assembleBase({ no, timeEpochMs, src: `${srcIp}:${srcPort}`, dst: `${dstIp}:${dstPort}`, protocol: 'SMB', info: `${op} ${path}`, length: 180, layers, payloadAscii: `${op} ${path}` });
}


