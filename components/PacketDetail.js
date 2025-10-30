"use client";
import React, { useState, useMemo } from 'react';
import { safeIso } from '../lib/safe-time';

function RtpPlayer({ packet }) {
  const [url, setUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [error, setError] = useState(null);
  
  const handleBuild = async () => {
    try {
      setError(null);
      const raw = packet.raw || [];
      const bytes = raw.length ? Uint8Array.from(raw) : new TextEncoder().encode(packet.payloadAscii || '');
      
      const rtp = await import('../lib/rtp-decoder');
      if (!rtp.isLikelyRtp(bytes)) { 
        setError('Not RTP or unsupported payload type'); 
        return; 
      }
      
      const hdr = rtp.parseRtpHeader(bytes);
      
      // Check if it's encrypted (SRTP)
      if (hdr.payloadType !== 0 && hdr.payloadType !== 8) {
        setError('Encrypted audio cannot be decoded without keys');
        return;
      }
      
      const payload = bytes.slice(hdr.headerLen);
      const { audioBuffer, sampleRate } = rtp.reconstructRtpStream([{ 
        seq: hdr.seq, 
        ts: hdr.ts, 
        ssrc: hdr.ssrc, 
        payloadType: hdr.payloadType, 
        payload 
      }]);
      
      const wav = rtp.exportWav(audioBuffer, sampleRate);
      const urlObj = URL.createObjectURL(wav);
      setBlob(wav);
      setUrl(urlObj);
    } catch (e) {
      setError('RTP decode failed: ' + e.message);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button 
          onClick={handleBuild} 
          className="px-3 py-1 text-[11px] font-mono rounded border border-gray-700 text-gray-200 hover:bg-gray-800 transition-colors"
        >
          Build Audio
        </button>
        {blob && (
          <a 
            href={URL.createObjectURL(blob)} 
            download="audio.wav" 
            className="px-3 py-1 text-[11px] font-mono rounded border border-gray-700 text-gray-200 hover:bg-gray-800 transition-colors"
          >
            Download WAV
          </a>
        )}
      </div>
      
      {error && (
        <div className="text-[10px] text-red-400 font-mono bg-red-900/20 border border-red-800 rounded p-2">
          {error}
        </div>
      )}
      
      {url ? (
        <div className="space-y-2">
          <audio controls src={url} className="w-full" />
          <div className="text-[9px] text-gray-400 font-mono">
            Audio reconstructed from RTP stream
          </div>
        </div>
      ) : !error && (
        <div className="text-[10px] text-gray-400 font-mono">
          Click "Build Audio" to reconstruct and play the RTP stream.
        </div>
      )}
    </div>
  );
}

export default function PacketDetail({ packet, onMarkAsEvidence, markedPacketIds, tcpStreams, allPackets = [] }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!packet) {
    return (
      <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex items-center justify-center h-full card-glow">
        <div className="text-center text-gray-500 text-xs font-mono">
          Select a packet to view details
        </div>
      </div>
    );
  }

  const isMarked = markedPacketIds.includes(packet.id);
  const streamKey = packet.streamKey || packet.fiveTupleKey || (packet.layers?.tcp || packet.layers?.udp ? `${packet.layers.ip?.srcIp || packet.layers.ip?.src}:${packet.layers.tcp?.srcPort || packet.layers.udp?.srcPort} -> ${packet.layers.ip?.dstIp || packet.layers.ip?.dst}:${packet.layers.tcp?.dstPort || packet.layers.udp?.dstPort}` : null);
  const stream = streamKey ? tcpStreams[streamKey] : null;

  // Direction helper (src:port → dst:port)
  const direction = () => {
    const layers = packet.layers || {};
    const sip = layers.ip?.srcIp || layers.ip?.src || packet.src;
    const dip = layers.ip?.dstIp || layers.ip?.dst || packet.dst;
    const sport = layers.tcp?.srcPort || layers.udp?.srcPort;
    const dport = layers.tcp?.dstPort || layers.udp?.dstPort;
    return sport !== undefined && dport !== undefined
      ? `${sip}:${sport} → ${dip}:${dport}`
      : `${sip} → ${dip}`;
  };

  // Render Summary Tab - Wireshark-style overview
  const renderSummary = () => {
    const src = packet.src || (packet.layers?.ip?.srcIp || packet.layers?.ip?.src);
    const dst = packet.dst || (packet.layers?.ip?.dstIp || packet.layers?.ip?.dst);
    const tsStr = typeof packet.ts === 'string' || typeof packet.ts === 'number' ? packet.ts : packet.timeEpochMs;
    const humanTime = safeIso(tsStr);
    const proto = packet.protocol || packet.proto || (packet.layers?.ip?.protocolName) || 'Unknown';
    const sport = packet.layers?.tcp?.srcPort || packet.layers?.udp?.srcPort;
    const dport = packet.layers?.tcp?.dstPort || packet.layers?.udp?.dstPort;
    const direction = sport !== undefined && dport !== undefined
      ? `${src}:${sport} → ${dst}:${dport}`
      : `${src} → ${dst}`;
    const tuple = packet.layers?.tcp ? `5-tuple: ${src}${sport!==undefined?`:${sport}`:''} → ${dst}${dport!==undefined?`:${dport}`:''}` : (packet.layers?.udp ? `4-tuple: ${src}${sport!==undefined?`:${sport}`:''} → ${dst}${dport!==undefined?`:${dport}`:''}` : `Endpoints: ${src} → ${dst}`);

    return (
      <div className="space-y-3">
        {/* Packet Overview - Wireshark style */}
        <div className="bg-gray-950 border border-gray-800 rounded p-3">
          <div className="text-[10px] text-terminal-green font-semibold mb-2 uppercase">PACKET OVERVIEW</div>
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-gray-400">No.:</span>
              <span className="text-gray-300">{packet.no || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time:</span>
              <span className="text-gray-300">{humanTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Direction:</span>
              <span className="text-gray-300">{direction}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Protocols:</span>
              <span className="text-terminal-green">{proto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Length:</span>
              <span className="text-gray-300">{packet.length || 0} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Tuple:</span>
              <span className="text-gray-300 truncate max-w-[60%] text-right">{tuple}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-gray-500 mb-1">Packet ID</div>
            <div className="text-terminal-green">{packet.id}</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-gray-500 mb-1">Length</div>
            <div className="text-gray-300">{packet.length} bytes</div>
          </div>
          {stream && (
            <div className="bg-gray-950 border border-gray-800 rounded p-2 col-span-2">
              <div className="text-gray-500 mb-1">Stream Packets</div>
              <div className="text-gray-300">{stream.packets.length} packets in flow</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Headers Tab - Expanded protocol decoding
  const renderHeaders = () => {
    const layers = packet.layers || {};
    const sections = [];

    // Ethernet
    if (layers.eth) {
      sections.push(
        <div key="eth" className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1 text-[10px]">[Ethernet II]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            <div>Destination MAC: <span className="text-blue-400">{layers.eth.dstMac || '00:00:00:00:00:00'}</span></div>
            <div>Source MAC: <span className="text-purple-400">{layers.eth.srcMac || '00:00:00:00:00:00'}</span></div>
            <div>Type: <span className="text-gray-400">0x{layers.eth.etherType?.toString(16).padStart(4, '0') || '0800'}</span></div>
            <div>Length: <span className="text-gray-400">{packet.length || 0} bytes</span></div>
          </div>
        </div>
      );
    }

    // IP
    if (layers.ip) {
      sections.push(
        <div key="ip" className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1 text-[10px]">[Internet Protocol v4]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            <div>Version: <span className="text-blue-400">{layers.ip.version || 4}</span></div>
            <div>Header Length: <span className="text-gray-400">{layers.ip.headerLength || 20} bytes</span></div>
            <div>Type of Service: <span className="text-gray-400">0x{(layers.ip.tos || 0).toString(16).padStart(2, '0')}</span></div>
            <div>Total Length: <span className="text-gray-400">{layers.ip.totalLength || packet.length || 0} bytes</span></div>
            <div>Identification: <span className="text-gray-400">0x{(layers.ip.id || 0).toString(16).padStart(4, '0')}</span></div>
            <div>Flags: <span className="text-yellow-400">{layers.ip.flags || '0x0000'}</span></div>
            <div>Fragment Offset: <span className="text-gray-400">{layers.ip.fragmentOffset || 0}</span></div>
            <div>Time to Live: <span className="text-orange-400">{layers.ip.ttl || 64}</span></div>
            <div>Protocol: <span className="text-terminal-green">{layers.ip.protocolName || 'Unknown'} ({layers.ip.protocol})</span></div>
            <div>Header Checksum: <span className="text-gray-400">0x{(layers.ip.checksum || 0).toString(16).padStart(4, '0')}</span></div>
            <div>Source IP: <span className="text-blue-400">{layers.ip.srcIp}</span></div>
            <div>Destination IP: <span className="text-purple-400">{layers.ip.dstIp}</span></div>
          </div>
        </div>
      );
    }

    // TCP
    if (layers.tcp) {
      sections.push(
        <div key="tcp" className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1 text-[10px]">[Transmission Control Protocol]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            <div>Source Port: <span className="text-blue-400">{layers.tcp.srcPort}</span></div>
            <div>Destination Port: <span className="text-purple-400">{layers.tcp.dstPort}</span></div>
            <div>Sequence Number: <span className="text-gray-400">{layers.tcp.seq || '0'}</span></div>
            <div>Acknowledgment Number: <span className="text-gray-400">{layers.tcp.ack || '0'}</span></div>
            <div>Header Length: <span className="text-gray-400">{layers.tcp.headerLength || 20} bytes</span></div>
            <div>Flags: <span className="text-yellow-400">{layers.tcp.flags || 'ACK'}</span></div>
            <div>Window Size: <span className="text-gray-400">{layers.tcp.window || '65535'}</span></div>
            <div>Checksum: <span className="text-gray-400">0x{(layers.tcp.checksum || 0).toString(16).padStart(4, '0')}</span></div>
            <div>Urgent Pointer: <span className="text-gray-400">{layers.tcp.urgent || '0'}</span></div>
            {layers.tcp.options && (
              <div>Options: <span className="text-gray-400">{layers.tcp.options}</span></div>
            )}
          </div>
        </div>
      );
    }

    // UDP
    if (layers.udp) {
      sections.push(
        <div key="udp" className="bg-gray-950 border border-gray-800 rounded p-2">
          <div className="text-terminal-green font-semibold mb-1 text-[10px]">[User Datagram Protocol]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            <div>Source Port: <span className="text-blue-400">{layers.udp.srcPort}</span></div>
            <div>Destination Port: <span className="text-purple-400">{layers.udp.dstPort}</span></div>
            <div>Length: <span className="text-gray-400">{layers.udp.length || 'N/A'} bytes</span></div>
          </div>
        </div>
      );
    }

    // HTTP
    if (layers.http) {
      sections.push(
        <div key="http" className="bg-gray-950 border border-yellow-600 rounded p-2">
          <div className="text-yellow-400 font-semibold mb-1 text-[10px]">[Hypertext Transfer Protocol]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            {layers.http.method && <div>Method: <span className="text-yellow-400">{layers.http.method}</span></div>}
            {layers.http.url && <div>URI: <span className="text-terminal-green">{layers.http.url}</span></div>}
            {layers.http.host && <div>Host: <span className="text-terminal-green">{layers.http.host}</span></div>}
            {layers.http.contentType && <div>Content-Type: <span className="text-gray-400">{layers.http.contentType}</span></div>}
            {layers.http.userAgent && <div>User-Agent: <span className="text-gray-400 text-[8px] truncate">{layers.http.userAgent}</span></div>}
            {layers.http.authorization && (
              <div>Authorization: <span className="text-yellow-400 text-[8px] truncate">{layers.http.authorization.substring(0, 60)}...</span></div>
            )}
          </div>
        </div>
      );
    }

    // DNS
    if (layers.dns) {
      sections.push(
        <div key="dns" className="bg-gray-950 border border-blue-600 rounded p-2">
          <div className="text-blue-400 font-semibold mb-1 text-[10px]">[Domain Name System]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            <div>Query: <span className="text-terminal-green break-all">{layers.dns.query || 'N/A'}</span></div>
            {layers.dns.type && <div>Type: <span className="text-gray-400">{layers.dns.type}</span></div>}
            {layers.dns.id && <div>ID: <span className="text-gray-400">0x{layers.dns.id.toString(16).padStart(4, '0')}</span></div>}
          </div>
        </div>
      );
    }

    // SMTP
    if (layers.smtp) {
      sections.push(
        <div key="smtp" className="bg-gray-950 border border-green-600 rounded p-2">
          <div className="text-green-400 font-semibold mb-1 text-[10px]">[Simple Mail Transfer Protocol]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            {layers.smtp.command && <div>Command: <span className="text-green-400">{layers.smtp.command}</span></div>}
            {layers.smtp.credential && (
              <div>Credential (base64): <span className="text-yellow-400 text-[8px] truncate">{layers.smtp.credential.substring(0, 60)}...</span></div>
            )}
          </div>
        </div>
      );
    }

    // SMB
    if (layers.smb) {
      sections.push(
        <div key="smb" className="bg-gray-950 border border-purple-600 rounded p-2">
          <div className="text-purple-400 font-semibold mb-1 text-[10px]">[Server Message Block]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            {layers.smb.command && <div>Operation: <span className="text-purple-400">{layers.smb.command}</span></div>}
            {layers.smb.filename && (
              <div>Filename: <span className="text-terminal-green break-all">{layers.smb.filename}</span></div>
            )}
          </div>
        </div>
      );
    }

    // ICMP
    if (layers.icmp) {
      sections.push(
        <div key="icmp" className="bg-gray-950 border border-orange-600 rounded p-2">
          <div className="text-orange-400 font-semibold mb-1 text-[10px]">[Internet Control Message Protocol]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            <div>Type: <span className="text-orange-400">{layers.icmp.type || 'Echo Request'}</span></div>
            <div>Code: <span className="text-gray-400">{layers.icmp.code || 0}</span></div>
            {layers.icmp.id && <div>ID: <span className="text-gray-400">0x{layers.icmp.id.toString(16).padStart(4, '0')}</span></div>}
            {layers.icmp.seq !== undefined && <div>Seq: <span className="text-gray-400">{layers.icmp.seq}</span></div>}
          </div>
        </div>
      );
    }

    // RTP
    if (layers.rtp) {
      sections.push(
        <div key="rtp" className="bg-gray-950 border border-cyan-600 rounded p-2">
          <div className="text-cyan-400 font-semibold mb-1 text-[10px]">[Real-time Transport Protocol]</div>
          <div className="ml-3 space-y-0.5 text-gray-300 text-[9px] font-mono">
            <div>Payload Type: <span className="text-cyan-400">{layers.rtp.payloadType || 'N/A'}</span></div>
            <div>Sequence: <span className="text-gray-400">{layers.rtp.seq || 'N/A'}</span></div>
            <div>Timestamp: <span className="text-gray-400">{layers.rtp.timestamp || 'N/A'}</span></div>
          </div>
        </div>
      );
    }

    if (sections.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 text-xs font-mono">
          No protocol layers decoded
        </div>
      );
    }

    return <div className="space-y-2">{sections}</div>;
  };

  // Render Hex/ASCII Tab - Neutral; synthesize placeholder when empty
  const renderHex = () => {
    const payloadHex = packet.payloadHex || '';
    const payloadAscii = packet.payloadAscii || '';
    let raw = packet.raw || [];
    if (raw.length === 0 && !payloadHex && !payloadAscii) {
      raw = Array.from({ length: 54 }, (_, i) => (i % 16 === 0 ? 0x45 : 0x00));
    }

    // Convert to rows if we have raw bytes
    const rows = [];
    if (raw.length > 0) {
      for (let i = 0; i < raw.length; i += 16) {
        const row = raw.slice(i, i + 16);
        const hex = row.map(b => b.toString(16).padStart(2, '0')).join(' ');
        const ascii = row.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
        const offset = i.toString(16).padStart(8, '0').toUpperCase();
        rows.push({ offset, hex, ascii, row });
      }
    } else if (payloadHex && payloadAscii) {
      // Fallback: parse hex string if raw not available
      const hexParts = payloadHex.split(' ').filter(Boolean);
      for (let i = 0; i < hexParts.length; i += 16) {
        const rowHex = hexParts.slice(i, i + 16).join(' ');
        const rowAscii = payloadAscii.substring(i * 2, (i * 2) + 32);
        const offset = (i * 16).toString(16).padStart(8, '0').toUpperCase();
        rows.push({ offset, hex: rowHex, ascii: rowAscii, row: [] });
      }
    }

    const highlightText = (text) => text;

    if (rows.length === 0) {
      return (
        <div className="text-gray-500 text-xs font-mono text-center py-8">
          No raw data available
        </div>
      );
    }

    return (
      <div className="font-mono text-[9px] space-y-0.5">
        <div className="grid grid-cols-[90px_1fr_90px] gap-3 text-gray-400 mb-2 pb-2 border-b border-gray-800 sticky top-0 bg-gray-950">
          <div>Offset</div>
          <div>Hex</div>
          <div>ASCII</div>
        </div>
        <div className="max-h-[500px] overflow-y-auto space-y-0.5">
          {rows.map((r, idx) => {
            const highlightedAscii = highlightText(r.ascii);
            const isSuspicious = highlightedAscii !== r.ascii;
            
            return (
              <div key={idx} className={`grid grid-cols-[90px_1fr_90px] gap-3 hover:bg-gray-800/50 rounded px-1 py-0.5`}>
                <div className="text-gray-500">{r.offset}</div>
                <div className="text-terminal-green break-all">{r.hex || ''}</div>
                <div className={`text-gray-400`} dangerouslySetInnerHTML={{ __html: highlightedAscii || r.ascii }}></div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Stream Tab - Neutral
  const renderStream = () => {
    // TCP Stream
    if (stream && packet.layers?.tcp) {
      const streamText = stream.fullAscii || '';
      const streamLength = streamText.length;
      const maxLength = 8192;

      return (
        <div className="space-y-3">
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[10px] text-terminal-green font-semibold mb-1">Follow Stream (TCP)</div>
            <div className="text-[9px] font-mono text-gray-400">Flow: {stream.packets.length} packets, {streamLength > maxLength ? `${maxLength}+` : streamLength} bytes</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded p-3">
            <div className="font-mono text-[10px] bg-black/60 border border-gray-800 rounded p-3 max-h-[500px] overflow-y-auto whitespace-pre-wrap break-all text-gray-300">
              {streamLength > maxLength 
                ? streamText.substring(0, maxLength) + '\n\n[... stream truncated ...]'
                : streamText || '[No readable text in stream]'}
            </div>
          </div>
          
        </div>
      );
    }
    
    // DNS aggregation
    if (packet.layers?.udp && packet.layers?.dns) {
      const srcIp = packet.layers.ip?.srcIp;
      const dnsPackets = allPackets?.filter(p => 
        p.layers?.udp && p.layers?.dns && 
        p.layers.ip?.srcIp === srcIp &&
        Math.abs((typeof p.ts === 'string' ? new Date(p.ts).getTime() : p.ts) - (typeof packet.ts === 'string' ? new Date(packet.ts).getTime() : packet.ts)) < 5000
      ) || [];

      return (
        <div className="space-y-3">
          <div className="bg-gray-950 border border-gray-800 rounded p-2">
            <div className="text-[10px] text-terminal-green font-semibold mb-1">DNS Query Pattern</div>
            <div className="text-[9px] font-mono text-gray-400">Last {Math.min(dnsPackets.length, 10)} DNS queries from {srcIp} in the last 5 seconds:</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded p-3 max-h-[500px] overflow-y-auto">
            {dnsPackets.slice(-10).map((p, i) => {
              const query = p.layers?.dns?.query || 'DNS query';
              const ts = typeof p.ts === 'string' ? new Date(p.ts) : new Date(p.ts);
              return (
                <div key={i} className="text-[10px] font-mono text-gray-300 py-1 border-b border-gray-800">
                  <span className="text-gray-500">{ts.toISOString().split('T')[1].slice(0, 12)}</span> - 
                  <span className="ml-2">{query}</span>
                  <span className="text-gray-500 ml-2">({query.length} chars)</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // ICMP
    if (packet.layers?.icmp || packet.proto === 'ICMP') {
      return (
        <div className="space-y-3">
          <div className="bg-gray-950 border border-gray-700 rounded p-3">
            <div className="text-[10px] text-gray-400 font-semibold mb-2">ICMP Ping Sequence</div>
            <div className="text-[9px] font-mono text-gray-300 space-y-1">
              <div>Source: {packet.layers?.ip?.srcIp || packet.src}</div>
              <div>Destination: {packet.layers?.ip?.dstIp || packet.dst}</div>
              {packet.layers?.icmp?.id && <div>ICMP ID: 0x{packet.layers.icmp.id.toString(16).padStart(4, '0')}</div>}
              {packet.layers?.icmp?.seq !== undefined && <div>Sequence: {packet.layers.icmp.seq}</div>}
            </div>
            
          </div>
        </div>
      );
    }

    // RTP
    if (packet.proto === 'RTP' || packet.layers?.rtp) {
      return (
        <div className="bg-gray-950 border border-gray-800 rounded p-3">
          <div className="text-[10px] text-terminal-green font-semibold mb-2">RTP Media Stream</div>
          <div className="text-[9px] font-mono text-gray-300">Continuous UDP packets with similar size/interval.</div>
        </div>
      );
    }
    
    // No stream available
    return (
      <div className="text-center py-8 text-gray-500 text-xs font-mono">
        {packet.layers?.tcp || packet.layers?.udp 
          ? 'No multi-packet application stream available for this protocol/flow.' 
          : 'Not a TCP/UDP packet. Stream analysis applies to connection-oriented protocols.'}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl flex flex-col h-full card-glow">
      <div className="text-xs uppercase tracking-wide text-gray-400 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <span className="flex items-center gap-2 text-gray-200 font-semibold">
          <span className="h-2 w-2 rounded-full bg-purple-400"></span>
          Packet Details
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-4">
        {['summary', 'headers', 'hex', 'stream', 'voip'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-[10px] font-mono transition-all border-b-2 ${
              activeTab === tab
                ? 'border-terminal-green text-terminal-green'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'summary' && renderSummary()}
        {activeTab === 'headers' && renderHeaders()}
        {activeTab === 'hex' && renderHex()}
        {activeTab === 'stream' && renderStream()}
        {activeTab === 'voip' && (
          packet.layers?.rtp || packet.proto === 'RTP' ? (
            <div className="space-y-3">
              <div className="bg-gray-950 border border-gray-800 rounded p-3">
                <div className="text-[10px] text-terminal-green font-semibold mb-2">RTP Audio Stream</div>
                <div className="text-[9px] text-gray-400 mb-3">
                  {packet.layers?.rtp?.payloadType === 0 ? 'G.711 μ-law (PCMU)' : 
                   packet.layers?.rtp?.payloadType === 8 ? 'G.711 A-law (PCMA)' : 
                   'Encrypted audio (SRTP)'}
                </div>
                <RtpPlayer packet={packet} />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-xs font-mono">No RTP data for this packet.</div>
          )
        )}
      </div>

      {/* Mark as Evidence Button */}
      <div className="px-4 pb-4 border-t border-gray-800 pt-3">
        <button
          onClick={() => onMarkAsEvidence(packet.id)}
          className={`w-full rounded-lg py-2 text-xs font-semibold font-mono transition-all duration-300 ${isMarked ? 'bg-gray-800 border border-gray-600 text-gray-200' : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200'}`}
        >
          {isMarked ? '✓ Marked' : 'Mark as Evidence'}
        </button>
      </div>
    </div>
  );
}
