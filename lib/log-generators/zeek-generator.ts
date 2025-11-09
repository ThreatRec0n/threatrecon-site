// Zeek (formerly Bro) log generator - creates realistic network connection logs

export interface ZeekConnLog {
  ts: string;
  uid: string;
  id_orig_h: string;
  id_orig_p: number;
  id_resp_h: string;
  id_resp_p: number;
  proto: string;
  service: string;
  duration: number;
  orig_bytes: number;
  resp_bytes: number;
  conn_state: string;
  local_orig: boolean;
  local_resp: boolean;
  missed_bytes: number;
  history: string;
  orig_pkts: number;
  orig_ip_bytes: number;
  resp_pkts: number;
  resp_ip_bytes: number;
  tunnel_parents: string[];
}

export interface ZeekHTTPLog {
  ts: string;
  uid: string;
  id_orig_h: string;
  id_orig_p: number;
  id_resp_h: string;
  id_resp_p: number;
  trans_depth: number;
  method: string;
  host: string;
  uri: string;
  referrer: string;
  version: string;
  user_agent: string;
  request_body_len: number;
  response_body_len: number;
  status_code: number;
  status_msg: string;
  info_code: number;
  info_msg: string;
  tags: string[];
  username: string;
  password: string;
  proxied: string[];
  orig_fuids: string[];
  orig_filenames: string[];
  orig_mime_types: string[];
  resp_fuids: string[];
  resp_filenames: string[];
  resp_mime_types: string[];
}

export interface ZeekDNSLog {
  ts: string;
  uid: string;
  id_orig_h: string;
  id_orig_p: number;
  id_resp_h: string;
  id_resp_p: number;
  proto: string;
  trans_id: number;
  rtt: number;
  query: string;
  qclass: number;
  qclass_name: string;
  qtype: number;
  qtype_name: string;
  rcode: number;
  rcode_name: string;
  AA: boolean;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  Z: number;
  answers: string[];
  TTLs: number[];
  rejected: boolean;
}

export function generateZeekConnLog(
  isMalicious: boolean = false,
  context?: Record<string, any>
): ZeekConnLog {
  const timestamp = new Date().toISOString();
  const maliciousIPs = ['185.220.101.0', '45.146.164.110'];
  const benignIPs = ['8.8.8.8', '1.1.1.1', '13.107.42.14'];

  const destIP = isMalicious
    ? maliciousIPs[Math.floor(Math.random() * maliciousIPs.length)]
    : benignIPs[Math.floor(Math.random() * benignIPs.length)];

  const destPort = isMalicious
    ? Math.floor(Math.random() * 1000) + 8000
    : [80, 443, 53][Math.floor(Math.random() * 3)];

  const duration = isMalicious
    ? Math.random() * 300 + 60 // 60-360 seconds (beaconing)
    : Math.random() * 30; // 0-30 seconds (normal)

  const origBytes = isMalicious
    ? Math.floor(Math.random() * 500) + 100 // Small beacon packets
    : Math.floor(Math.random() * 10000) + 1000; // Normal traffic

  return {
    ts: timestamp,
    uid: `C${Math.random().toString(36).substr(2, 10)}`,
    id_orig_h: context?.sourceIP || '10.0.1.100',
    id_orig_p: Math.floor(Math.random() * 60000) + 1000,
    id_resp_h: destIP,
    id_resp_p: destPort,
    proto: 'tcp',
    service: destPort === 443 ? 'ssl' : destPort === 80 ? 'http' : '-',
    duration: duration,
    orig_bytes: origBytes,
    resp_bytes: isMalicious ? Math.floor(Math.random() * 200) : Math.floor(Math.random() * 5000),
    conn_state: isMalicious ? 'SF' : ['SF', 'S0', 'REJ'][Math.floor(Math.random() * 3)],
    local_orig: true,
    local_resp: false,
    missed_bytes: 0,
    history: isMalicious ? 'ShADad' : 'ShADadFf',
    orig_pkts: isMalicious ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 50) + 10,
    orig_ip_bytes: origBytes + (isMalicious ? 40 : 2000),
    resp_pkts: isMalicious ? Math.floor(Math.random() * 3) + 1 : Math.floor(Math.random() * 30) + 5,
    resp_ip_bytes: isMalicious ? Math.floor(Math.random() * 200) : Math.floor(Math.random() * 5000),
    tunnel_parents: [],
  };
}

export function generateZeekHTTPLog(
  isMalicious: boolean = false,
  context?: Record<string, any>
): ZeekHTTPLog {
  const timestamp = new Date().toISOString();
  const maliciousDomains = ['c2-malicious-domain.com', 'evil-command-control.net'];
  const benignDomains = ['microsoft.com', 'google.com', 'github.com'];

  const host = isMalicious
    ? maliciousDomains[Math.floor(Math.random() * maliciousDomains.length)]
    : benignDomains[Math.floor(Math.random() * benignDomains.length)];

  const uri = isMalicious
    ? '/beacon?data=' + Math.random().toString(36).substr(2, 10)
    : ['/', '/search', '/about'][Math.floor(Math.random() * 3)];

  return {
    ts: timestamp,
    uid: `C${Math.random().toString(36).substr(2, 10)}`,
    id_orig_h: context?.sourceIP || '10.0.1.100',
    id_orig_p: Math.floor(Math.random() * 60000) + 1000,
    id_resp_h: isMalicious ? '185.220.101.0' : '13.107.42.14',
    id_resp_p: 80,
    trans_depth: 1,
    method: isMalicious ? 'POST' : ['GET', 'POST'][Math.floor(Math.random() * 2)],
    host: host,
    uri: uri,
    referrer: '-',
    version: '1.1',
    user_agent: isMalicious
      ? 'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)' // Suspicious old user agent
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    request_body_len: isMalicious ? Math.floor(Math.random() * 500) : Math.floor(Math.random() * 1000),
    response_body_len: isMalicious ? Math.floor(Math.random() * 200) : Math.floor(Math.random() * 50000),
    status_code: isMalicious ? 200 : [200, 301, 404][Math.floor(Math.random() * 3)],
    status_msg: 'OK',
    info_code: 0,
    info_msg: '-',
    tags: [],
    username: '-',
    password: '-',
    proxied: [],
    orig_fuids: [],
    orig_filenames: [],
    orig_mime_types: [],
    resp_fuids: [],
    resp_filenames: [],
    resp_mime_types: [],
  };
}

export function generateZeekDNSLog(
  isMalicious: boolean = false,
  context?: Record<string, any>
): ZeekDNSLog {
  const timestamp = new Date().toISOString();
  const maliciousDomains = ['c2-malicious-domain.com', 'evil-command-control.net', 'suspicious-beacon.org'];
  const benignDomains = ['microsoft.com', 'google.com', 'github.com', 'stackoverflow.com'];

  const query = isMalicious
    ? maliciousDomains[Math.floor(Math.random() * maliciousDomains.length)]
    : benignDomains[Math.floor(Math.random() * benignDomains.length)];

  return {
    ts: timestamp,
    uid: `C${Math.random().toString(36).substr(2, 10)}`,
    id_orig_h: context?.sourceIP || '10.0.1.100',
    id_orig_p: Math.floor(Math.random() * 60000) + 1000,
    id_resp_h: '8.8.8.8',
    id_resp_p: 53,
    proto: 'udp',
    trans_id: Math.floor(Math.random() * 65535),
    rtt: Math.random() * 0.1,
    query: query,
    qclass: 1,
    qclass_name: 'C_INTERNET',
    qtype: 1,
    qtype_name: 'A',
    rcode: 0,
    rcode_name: 'NOERROR',
    AA: false,
    TC: false,
    RD: true,
    RA: true,
    Z: 0,
    answers: isMalicious ? ['185.220.101.0'] : ['13.107.42.14'],
    TTLs: [300],
    rejected: false,
  };
}

export function generateZeekLogs(
  type: 'conn' | 'http' | 'dns',
  count: number,
  maliciousRatio: number = 0.1,
  context?: Record<string, any>
): Array<ZeekConnLog | ZeekHTTPLog | ZeekDNSLog> {
  const logs: Array<ZeekConnLog | ZeekHTTPLog | ZeekDNSLog> = [];

  for (let i = 0; i < count; i++) {
    const isMalicious = Math.random() < maliciousRatio;
    switch (type) {
      case 'conn':
        logs.push(generateZeekConnLog(isMalicious, context));
        break;
      case 'http':
        logs.push(generateZeekHTTPLog(isMalicious, context));
        break;
      case 'dns':
        logs.push(generateZeekDNSLog(isMalicious, context));
        break;
    }
  }

  return logs.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

