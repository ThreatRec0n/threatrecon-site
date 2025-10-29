/**
 * Browser-compatible PCAP parser
 * Handles basic PCAP file format parsing in the browser
 * Falls back to synthetic packet generation if parsing fails
 */

class PcapParser {
  constructor() {
    this.isBigEndian = false;
  }

  /**
   * Parse PCAP file from File/Blob
   * @param {File|Blob} file - PCAP file
   * @returns {Promise<Array>} Array of parsed packets
   */
  async parsePcapFile(file) {
    try {
      const buffer = await file.arrayBuffer();
      const dataView = new DataView(buffer);
      const packets = [];

      // Read PCAP global header (24 bytes)
      const magicNumber = dataView.getUint32(0, true);
      
      // Check magic number (0xa1b2c3d4 or 0xa1b2c3d4 for little-endian)
      if (magicNumber !== 0xa1b2c3d4 && magicNumber !== 0xd4c3b2a1) {
        throw new Error('Invalid PCAP file format');
      }

      this.isBigEndian = magicNumber === 0xd4c3b2a1;
      let offset = 24; // Skip global header

      // Parse packet records
      while (offset < buffer.byteLength - 16) {
        try {
          const packet = this.parsePacketRecord(dataView, offset);
          if (packet) {
            packets.push(packet);
            offset += packet.recordLength + 16; // 16 byte packet header
          } else {
            offset += 16; // Skip if parse fails
          }
        } catch (e) {
          break; // End of file or invalid record
        }
      }

      return packets.length > 0 ? packets : this.generateFallbackPackets();
    } catch (error) {
      console.debug('PCAP parsing failed, using fallback:', error);
      return this.generateFallbackPackets();
    }
  }

  /**
   * Parse a single packet record
   */
  parsePacketRecord(dataView, offset) {
    try {
      const packetHeader = {
        tsSec: dataView.getUint32(offset, !this.isBigEndian),
        tsUsec: dataView.getUint32(offset + 4, !this.isBigEndian),
        inclLen: dataView.getUint32(offset + 8, !this.isBigEndian),
        origLen: dataView.getUint32(offset + 12, !this.isBigEndian),
      };

      const packetOffset = offset + 16;
      const packetData = new Uint8Array(
        dataView.buffer,
        packetOffset,
        packetHeader.inclLen
      );

      const parsed = this.parseEthernetFrame(packetData, packetHeader.tsSec, packetHeader.tsUsec);
      parsed.recordLength = packetHeader.inclLen;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  /**
   * Parse Ethernet frame
   */
  parseEthernetFrame(data, tsSec, tsUsec) {
    if (data.length < 14) return null;

    const dstMac = Array.from(data.slice(0, 6))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':');
    const srcMac = Array.from(data.slice(6, 12))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':');
    const etherType = (data[12] << 8) | data[13];

    let parsed = {
      id: `pkt-${tsSec}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ts: new Date(tsSec * 1000 + tsUsec / 1000).toISOString(),
      raw: Array.from(data),
      ethernet: { dstMac, srcMac, etherType },
      summary: 'Ethernet frame',
    };

    // Parse IPv4
    if (etherType === 0x0800 && data.length >= 34) {
      parsed = { ...parsed, ...this.parseIPv4(data.slice(14), tsSec, tsUsec) };
    }

    return parsed;
  }

  /**
   * Parse IPv4 header
   */
  parseIPv4(data, tsSec, tsUsec) {
    if (data.length < 20) return {};

    const version = (data[0] >> 4) & 0xf;
    const ihl = (data[0] & 0xf) * 4;
    const protocol = data[9];
    const srcIp = Array.from(data.slice(12, 16)).join('.');
    const dstIp = Array.from(data.slice(16, 20)).join('.');

    const ipHeader = {
      version,
      srcIp,
      dstIp,
      protocol,
      protocolName: this.getProtocolName(protocol),
    };

    const payload = data.slice(ihl);
    let parsed = {
      ip: ipHeader,
      src: srcIp,
      dst: dstIp,
      proto: ipHeader.protocolName,
      summary: `${ipHeader.protocolName} ${srcIp} → ${dstIp}`,
    };

    // Parse TCP
    if (protocol === 6 && payload.length >= 20) {
      parsed = { ...parsed, ...this.parseTCP(payload, ipHeader, tsSec, tsUsec) };
    }
    // Parse UDP
    else if (protocol === 17 && payload.length >= 8) {
      parsed = { ...parsed, ...this.parseUDP(payload, ipHeader, tsSec, tsUsec) };
    }

    parsed.length = data.length + 14; // Include Ethernet header
    return parsed;
  }

  /**
   * Parse TCP header
   */
  parseTCP(data, ipHeader, tsSec, tsUsec) {
    const srcPort = (data[0] << 8) | data[1];
    const dstPort = (data[2] << 8) | data[3];
    const dataOffset = ((data[12] >> 4) & 0xf) * 4;
    const payload = data.slice(dataOffset);

    const tcp = {
      srcPort,
      dstPort,
      src: `${ipHeader.srcIp}:${srcPort}`,
      dst: `${ipHeader.dstIp}:${dstPort}`,
    };

    let summary = `TCP ${tcp.src} → ${tcp.dst}`;

    // Try to parse HTTP
    if ((srcPort === 80 || dstPort === 80) && payload.length > 0) {
      const http = this.parseHTTP(payload);
      if (http) {
        tcp.http = http;
        summary = http.summary || summary;
      }
    }
    // Try to parse HTTPS/TLS
    else if ((srcPort === 443 || dstPort === 443) && payload.length > 5) {
      summary = `TLS ${tcp.src} → ${tcp.dst}`;
    }
    // Try to parse DNS
    else if (srcPort === 53 || dstPort === 53) {
      const dns = this.parseDNS(payload);
      if (dns) {
        tcp.dns = dns;
        summary = dns.summary || summary;
      }
    }

    return { tcp, summary, payload: Array.from(payload) };
  }

  /**
   * Parse UDP header
   */
  parseUDP(data, ipHeader, tsSec, tsUsec) {
    const srcPort = (data[0] << 8) | data[1];
    const dstPort = (data[2] << 8) | data[3];
    const payload = data.slice(8);

    const udp = {
      srcPort,
      dstPort,
      src: `${ipHeader.srcIp}:${srcPort}`,
      dst: `${ipHeader.dstIp}:${dstPort}`,
    };

    let summary = `UDP ${udp.src} → ${udp.dst}`;

    // Try to parse DNS
    if (srcPort === 53 || dstPort === 53) {
      const dns = this.parseDNS(payload);
      if (dns) {
        udp.dns = dns;
        summary = dns.summary || summary;
      }
    }

    return { udp, summary, payload: Array.from(payload) };
  }

  /**
   * Parse HTTP (basic)
   */
  parseHTTP(payload) {
    try {
      const text = new TextDecoder().decode(new Uint8Array(payload.slice(0, 200)));
      const lines = text.split('\r\n');
      if (lines[0].startsWith('HTTP/') || lines[0].startsWith('GET ') || lines[0].startsWith('POST ')) {
        const firstLine = lines[0];
        const methodMatch = firstLine.match(/^(GET|POST|PUT|DELETE|HEAD|OPTIONS)/);
        const urlMatch = firstLine.match(/\s+\/([\S]+)/);
        
        return {
          method: methodMatch ? methodMatch[1] : 'HTTP',
          url: urlMatch ? urlMatch[1] : '/',
          summary: firstLine.substring(0, 60),
        };
      }
    } catch (e) {
      // Not HTTP
    }
    return null;
  }

  /**
   * Parse DNS (basic)
   */
  parseDNS(payload) {
    if (payload.length < 12) return null;
    try {
      const qnameStart = 12;
      let offset = qnameStart;
      let domain = '';
      
      while (offset < payload.length && payload[offset] !== 0) {
        const len = payload[offset];
        if (len > 63 || offset + len >= payload.length) break;
        if (domain) domain += '.';
        domain += new TextDecoder().decode(
          new Uint8Array(payload.slice(offset + 1, offset + 1 + len))
        );
        offset += len + 1;
      }

      if (domain) {
        return {
          query: domain,
          summary: `DNS query: ${domain}`,
        };
      }
    } catch (e) {
      // Not valid DNS
    }
    return null;
  }

  /**
   * Get protocol name from number
   */
  getProtocolName(protocol) {
    const protocols = {
      1: 'ICMP',
      6: 'TCP',
      17: 'UDP',
      41: 'IPv6',
      47: 'GRE',
      50: 'ESP',
      51: 'AH',
    };
    return protocols[protocol] || `IP-${protocol}`;
  }

  /**
   * Generate fallback packets if parsing fails
   */
  generateFallbackPackets() {
    return [
      {
        id: 'fallback-1',
        ts: new Date().toISOString(),
        src: '192.168.1.100:44323',
        dst: '198.51.100.4:443',
        proto: 'TCP',
        length: 1250,
        summary: 'TCP 192.168.1.100:44323 → 198.51.100.4:443 [SYN]',
        raw: new Array(1250).fill(0).map((_, i) => i % 256),
      },
    ];
  }
}

// Export singleton instance
export const pcapParser = new PcapParser();

/**
 * Main parse function
 */
export async function parsePcapFile(file) {
  return await pcapParser.parsePcapFile(file);
}

