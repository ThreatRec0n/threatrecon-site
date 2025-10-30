/**
 * TCP Stream Builder
 * Groups packets by 5-tuple and reconstructs streams
 */

/**
 * Build 5-tuple key from packet
 */
export function getFiveTupleKey(packet) {
  if (packet.layers?.ip && packet.layers?.tcp) {
    const { srcIp, dstIp } = packet.layers.ip;
    const { srcPort, dstPort } = packet.layers.tcp;
    // Normalize: always use smaller IP:port first
    const tuple1 = `${srcIp}:${srcPort} -> ${dstIp}:${dstPort}`;
    const tuple2 = `${dstIp}:${dstPort} -> ${srcIp}:${srcPort}`;
    return tuple1 < tuple2 ? tuple1 : tuple2;
  }
  return null;
}

/**
 * Build TCP streams from packets
 * @param {Array} packets - Array of parsed packets
 * @returns {Object} Streams keyed by 5-tuple
 */
export function buildTcpStreams(packets) {
  const streams = {};
  
  packets.forEach(packet => {
    const key = getFiveTupleKey(packet);
    if (!key) return;
    
    if (!streams[key]) {
      streams[key] = {
        packets: [],
        fullAscii: '',
        fullHex: [],
      };
    }
    
    streams[key].packets.push(packet);
    
    // Append payload to stream
    if (packet.payloadAscii) {
      streams[key].fullAscii += packet.payloadAscii;
    }
    if (packet.payloadHex) {
      streams[key].fullHex.push(...packet.payloadHex);
    }
  });
  
  // Sort packets by timestamp within each stream
  Object.keys(streams).forEach(key => {
    streams[key].packets.sort((a, b) => {
      const tsA = typeof a.ts === 'string' ? new Date(a.ts).getTime() : a.ts;
      const tsB = typeof b.ts === 'string' ? new Date(b.ts).getTime() : b.ts;
      return tsA - tsB;
    });
  });
  
  return streams;
}

/**
 * Detect suspicious patterns in stream
 */
export function analyzeStream(stream) {
  const ascii = stream.fullAscii.toLowerCase();
  const findings = [];
  
  // Check for credentials
  if (ascii.includes('password') || ascii.includes('username') || ascii.includes('login')) {
    findings.push('Potential credential leak in stream');
  }
  
  // Check for file transfers
  if (ascii.includes('multipart/form-data') || ascii.includes('content-disposition')) {
    findings.push('File transfer detected');
  }
  
  // Check for base64 encoding
  if (/[A-Za-z0-9+\/]{100,}/.test(stream.fullAscii)) {
    findings.push('Base64 encoded data detected');
  }
  
  // Check for suspicious domains
  if (/exfil|malware|evil|suspicious/.test(ascii)) {
    findings.push('Suspicious domain or payload pattern');
  }
  
  return findings;
}

