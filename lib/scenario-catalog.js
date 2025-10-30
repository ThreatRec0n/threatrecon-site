import { makeSeed, privateIp, privateIpNear, publicIp, resolverIp, fqdn, randInt, pick, ephemeralPort } from './random-net.js';
import { buildHTTP, buildHTTPS, buildDNS, buildSMB, buildSMTP, buildIMAP, buildFTP, buildICMP, buildRTP, buildSIP } from './packet-factory';

function timeBase(prng){ return Date.now() - randInt(30_000, 300_000, prng); }

function assignMeta(packets){
  // assign packet numbers and timestamps increasing
  const base = packets.length ? packets[0].timeEpochMs : Date.now();
  return packets
    .sort((a,b)=>a.timeEpochMs-b.timeEpochMs)
    .map((p,i)=>({ ...p, no: i+1, timeEpochMs: base + i*randInt(50, 500) }));
}

function heuristics(list){ return list; }

// Evidence count rules per difficulty
export function pickEvidenceCount(difficulty) {
  if (difficulty === 'Beginner') return 1 + Math.floor(Math.random() * 2);         // 1 to 2
  if (difficulty === 'Intermediate') return 2 + Math.floor(Math.random() * 3);     // 2 to 4
  return 3 + Math.floor(Math.random() * 5);                                        // 3 to 7
}

export function pickPacketCount(difficulty) {
  if (difficulty === 'Beginner') return 25;
  if (difficulty === 'Intermediate') return 50;
  return 100;
}

export const SCENARIOS = {
  mixed: {
    label: 'Mixed Investigation',
    hints: heuristics([
      'Focus on the protocol family most likely to carry files.',
      'Look for repetitive, high-entropy labels in name resolution traffic.',
      'Correlate directionality and timing rather than a single header.',
    ]),
    generate({ difficulty = 'Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const src = privateIp(prng);
      const sni = fqdn(['com','net','io','org'], prng);
      const ext = publicIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      
      // Generate baseline traffic (remaining after evidence)
      const baselineCount = packetCount - evidenceCount;
      for(let i=0;i<Math.floor(baselineCount*0.5);i++){
        packets.push(buildHTTPS({ no: i+1, timeEpochMs: baseTime + i*200, srcIp: src, dstIp: ext, srcPort: ephemeralPort(prng), sni }));
      }
      for(let i=0;i<Math.floor(baselineCount*0.2);i++){
        packets.push(buildDNS({ no: 1, timeEpochMs: baseTime + i*180, srcIp: src, dstIp: resolverIp(prng, src), srcPort: ephemeralPort(prng), qname: fqdn(['com','net','org'], prng), qtype: pick(['A','AAAA','TXT'], prng) }));
      }
      for(let i=0;i<Math.floor(baselineCount*0.1);i++){
        packets.push(buildHTTP({ no: 1, timeEpochMs: baseTime + i*220, srcIp: src, dstIp: publicIp(prng), srcPort: ephemeralPort(prng), method: 'GET', host: fqdn(['com','net'], prng), uri: '/' }));
      }
      if (packetCount > 30) packets.push(buildICMP({ no: 1, timeEpochMs: baseTime + 111, srcIp: src, dstIp: publicIp(prng) }));
      
      // Generate evidence packets
      let evidencePackets = [];
      const choice = pick(['http_exfil','dns_tunnel','smtp_auth','smb_copy','beacon','rtp'], prng);
      
      if (choice==='http_exfil'){
        for(let i=0; i<evidenceCount; i++) {
          const filename = `payroll_${randInt(1,4,prng)}.xlsx`;
          const body = `------WebKit\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n\r\n[file bytes]`;
          evidencePackets.push(buildHTTP({ no: 1, timeEpochMs: baseTime + 9999 + i*100, srcIp: src, dstIp: ext, srcPort: ephemeralPort(prng), method: 'POST', host: sni, uri: '/upload', headers: { 'Content-Type':'multipart/form-data' }, body }));
        }
      } else if (choice==='dns_tunnel'){
        for(let i=0; i<evidenceCount; i++) {
          const label = Array.from({length: randInt(40,60,prng)}, ()=>pick('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split(''), prng)).join('');
          const qname = `${label}.${fqdn(['com'], prng)}`;
          evidencePackets.push(buildDNS({ no: 1, timeEpochMs: baseTime + 9999 + i*100, srcIp: src, dstIp: resolverIp(prng, src), srcPort: ephemeralPort(prng), qname, qtype: 'TXT' }));
        }
      } else if (choice==='smtp_auth'){
        for(let i=0; i<evidenceCount; i++) {
          const b64 = btoa(`user${randInt(10,99,prng)}:pass${randInt(100,999,prng)}`);
          evidencePackets.push(buildSMTP({ no: 1, timeEpochMs: baseTime + 9999 + i*100, srcIp: src, dstIp: ext, srcPort: ephemeralPort(prng), cmd: 'AUTH PLAIN', arg: b64 }));
        }
      } else if (choice==='smb_copy'){
        for(let i=0; i<evidenceCount; i++) {
          evidencePackets.push(buildSMB({ no: 1, timeEpochMs: baseTime + 9999 + i*100, srcIp: src, dstIp: privateIpNear(src, 24, prng), srcPort: ephemeralPort(prng), op: 'Write', path: `\\\\10.0.${randInt(0,255,prng)}.${randInt(1,254,prng)}\\finance\\payroll.xlsx` }));
        }
      } else if (choice==='beacon'){
        for(let i=0; i<evidenceCount; i++) {
          evidencePackets.push(buildHTTPS({ no: 1, timeEpochMs: baseTime + 7000 + i*30000, srcIp: src, dstIp: ext, srcPort: ephemeralPort(prng), sni }));
        }
      } else if (choice==='rtp'){
        for(let i=0; i<evidenceCount; i++) {
          evidencePackets.push(buildRTP({ no: 1, timeEpochMs: baseTime + 9999 + i*100, srcIp: src, dstIp: publicIp(prng), srcPort: 16384, dstPort: 16384, ssrc: randInt(1,1e6,prng), seq: randInt(1,65535,prng), pt: 0 }));
        }
      }
      
      const all = assignMeta([...packets, ...evidencePackets]);
      return {
        packets: all,
        groundTruth: { ids: evidencePackets.map(p=>p.id), reason: 'Scenario evidence packet(s) embedded in realistic traffic', rubric: ['Directionality/context', 'Protocol semantics', 'Content indicates misuse'] },
        hints: SCENARIOS.mixed.hints,
      };
    }
  },
  'rtp-voip': {
    label: 'VoIP (RTP G.711 burst)',
    hints: heuristics(['Identify the control messages that negotiate media ports.','Check audio payload types common for unencrypted voice.','Encrypted streams require keys; note when decryption is not possible.']),
    generate({ difficulty = 'Beginner', packetCount, evidenceCount, seed }) {
      const { prng } = makeSeed();
      const a = privateIp(prng), b = privateIpNear(a, 24, prng);
      const ext = publicIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      const callId = `call-${randInt(10000,99999,prng)}@${fqdn(['com','net'], prng)}`;
      const sdp = `v=0\r\no=- 0 0 IN IP4 ${a}\r\ns=VoIP\r\nc=IN IP4 ${a}\r\nt=0 0\r\nm=audio 16384 RTP/AVP 0 8\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\n`;
      packets.push(buildSIP({ no:1, timeEpochMs: baseTime, srcIp:a, dstIp:b, srcPort:5060, dstPort:5060, method:'INVITE', callId, from:`sip:a@${a}`, to:`b@${b}`, sdp }));
      packets.push(buildSIP({ no:1, timeEpochMs: baseTime+200, srcIp:b, dstIp:a, srcPort:5060, dstPort:5060, method:'200 OK', callId, from:`sip:b@${b}`, to:`a@${a}`, sdp }));
      packets.push(buildSIP({ no:1, timeEpochMs: baseTime+300, srcIp:a, dstIp:b, srcPort:5060, dstPort:5060, method:'ACK', callId, from:`sip:a@${a}`, to:`b@${b}` }));
      // RTP burst (mix decodable PT 0 and some SRTP-like other PTs)
      const ssrc = randInt(1,1e9,prng) >>> 0;
      let seq = randInt(1,65000,prng);
      const rtpCount = Math.max(6, Math.floor(packetCount*0.25));
      for(let i=0;i<rtpCount; i++){
        const pt = i % 4 === 0 ? 96 : 0; // some undecodable PT
        packets.push(buildRTP({ no:1, timeEpochMs: baseTime+400+i*20, srcIp:a, dstIp:b, srcPort:16384, dstPort:16384, ssrc, seq: (seq+i)&0xFFFF, pt }));
      }
      // Fill benign
      while (packets.length < packetCount - evidenceCount) {
        packets.push(buildDNS({ no:1, timeEpochMs: baseTime + 800 + packets.length*30, srcIp:a, dstIp: resolverIp(prng, a), srcPort: ephemeralPort(prng), qname: fqdn(['com','net'], prng) }));
      }
      // Evidence: RTP PT 0 frames
      const evidencePackets = packets.filter(p=>p.proto==='RTP' && p.layers?.rtp?.pt === 0).slice(0, evidenceCount);
      const all = assignMeta([...packets, ...evidencePackets]);
      return { packets: all, groundTruth: { ids: evidencePackets.map(p=>p.id), reason: 'Unencrypted RTP audio frames present', rubric: [] }, hints: SCENARIOS['rtp-voip'].hints };
    }
  },

  'http-exfil': {
    label: 'HTTP Exfiltration',
    hints: heuristics(['File transfers often use request bodies; inspect payload context.','Consider whether traffic is outbound to unfamiliar external hosts.','Reconstruct the session to understand the full narrative.']),
    generate({ difficulty = 'Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const src = privateIp(prng), ext = publicIp(prng), sni = fqdn(['com','net'], prng);
      const baseTime = timeBase(prng);
      const packets = [];
      // baseline
      for(let i=0;i<packetCount - evidenceCount;i++) {
        packets.push(buildHTTP({ no:1, timeEpochMs: baseTime + i*200, srcIp: src, dstIp: publicIp(prng), srcPort: ephemeralPort(prng), method: pick(['GET','GET','GET','HEAD'], prng), host: fqdn(['com','net'], prng), uri: '/' }));
      }
      // evidence
      const ev = [];
      for(let i=0; i<evidenceCount; i++) {
        const filename = `client_export_${randInt(100,999,prng)}.xlsx`;
        const body = `------\r\nContent-Disposition: form-data; name=\"file\"; filename=\"${filename}\"\r\n\r\n[file bytes]`;
        ev.push(buildHTTP({ no:1, timeEpochMs: baseTime + 9999 + i*100, srcIp: src, dstIp: ext, srcPort: ephemeralPort(prng), method:'POST', host: sni, uri:'/upload', headers:{'Content-Type':'multipart/form-data'}, body }));
      }
      const all = assignMeta([...packets, ...ev]);
      return { packets: all, groundTruth: { ids: ev.map(p=>p.id), reason:'HTTP POST with file upload body', rubric:['File upload body','External destination','POST semantics'] }, hints: SCENARIOS['http-exfil'].hints };
    }
  },

  'dns-tunnel': {
    label: 'DNS Tunneling',
    hints: heuristics(['Look for repetitive, high-entropy labels in name resolution traffic.','Check query rates and unusually long domain labels.','Correlate requests without meaningful responses.']),
    generate({ difficulty = 'Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const src = privateIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      // baseline normal DNS/HTTPS
      for(let i=0;i<Math.floor((packetCount - evidenceCount)*0.6);i++) packets.push(buildDNS({ no:1, timeEpochMs: baseTime + i*180, srcIp: src, dstIp: resolverIp(prng, src), srcPort: ephemeralPort(prng), qname: fqdn(['com','net','org'], prng), qtype: pick(['A','AAAA'], prng) }));
      for(let i=0;i<Math.floor((packetCount - evidenceCount)*0.4);i++) packets.push(buildHTTPS({ no:1, timeEpochMs: baseTime + 400 + i*200, srcIp: src, dstIp: publicIp(prng), srcPort: ephemeralPort(prng), sni: fqdn(['com','net'], prng) }));
      // evidence DNS TXT queries with long labels
      const ev = [];
      for(let i=0;i<evidenceCount;i++) {
        const label = Array.from({length: randInt(40,60,prng)}, ()=>pick('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split(''), prng)).join('');
        const qname = `${label}.${fqdn(['com'], prng)}`;
        ev.push(buildDNS({ no:1, timeEpochMs: baseTime + 9999 + i*90, srcIp: src, dstIp: resolverIp(prng, src), srcPort: ephemeralPort(prng), qname, qtype:'TXT' }));
      }
      const all = assignMeta([...packets, ...ev]);
      return { packets: all, groundTruth: { ids: ev.map(p=>p.id), reason:'High-entropy DNS queries carrying tunneled data', rubric:['Entropy','TXT queries','Bursting'] }, hints: SCENARIOS['dns-tunnel'].hints };
    }
  },

  'smb-lateral': {
    label: 'SMB Lateral Movement',
    hints: heuristics(['Focus on internal file service traffic within the same private range.','Look for file write operations between peers.','Correlate directionality and access patterns.']),
    generate({ difficulty = 'Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const a = privateIp(prng), b = privateIpNear(a, 24, prng);
      const baseTime = timeBase(prng);
      const packets = [];
      // baseline web/dns
      for(let i=0;i<Math.floor((packetCount - evidenceCount)*0.5);i++) packets.push(buildHTTPS({ no:1, timeEpochMs: baseTime + i*160, srcIp:a, dstIp: publicIp(prng), srcPort: ephemeralPort(prng), sni: fqdn(['com','net'], prng) }));
      for(let i=0;i<Math.floor((packetCount - evidenceCount)*0.3);i++) packets.push(buildDNS({ no:1, timeEpochMs: baseTime + 300 + i*140, srcIp:a, dstIp: resolverIp(prng, a), srcPort: ephemeralPort(prng), qname: fqdn(['com','net'], prng) }));
      // evidence SMB writes
      const ev = [];
      for(let i=0;i<evidenceCount;i++) ev.push(buildSMB({ no:1, timeEpochMs: baseTime + 800 + i*120, srcIp:a, dstIp:b, srcPort: 445, op:'Write', path: `\\\\${b}\\share\\sensitive_${randInt(1,9,prng)}.xlsx` }));
      const all = assignMeta([...packets, ...ev]);
      return { packets: all, groundTruth: { ids: ev.map(p=>p.id), reason:'Unauthorized SMB file write to peer', rubric:['Internal to internal','Write op','Sensitive path'] }, hints: SCENARIOS['smb-lateral'].hints };
    }
  },

  'ssh-bruteforce': {
    label: 'SSH Bruteforce',
    hints: heuristics(['Look for repeated connection attempts to the same service port.','Short, repeated sessions without data often indicate guessing.','Correlate timing bursts to a single external source.']),
    generate({ difficulty = 'Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const a = privateIp(prng), ext = publicIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      // baseline normal traffic
      for(let i=0;i<packetCount - evidenceCount;i++) packets.push(buildHTTPS({ no:1, timeEpochMs: baseTime + i*130, srcIp:a, dstIp: publicIp(prng), srcPort: ephemeralPort(prng), sni: fqdn(['com','net'], prng) }));
      // evidence simulate TCP SYNs to 22 using HTTP builder as placeholder for display context
      const ev = [];
      for(let i=0;i<evidenceCount;i++) ev.push(buildHTTP({ no:1, timeEpochMs: baseTime + 900 + i*60, srcIp: ext, dstIp: a, srcPort: ephemeralPort(prng), method:'GET', host: `${a}:22`, uri:'/' }));
      const all = assignMeta([...packets, ...ev]);
      return { packets: all, groundTruth: { ids: ev.map(p=>p.id), reason:'Repeated connection attempts to SSH service', rubric:['Repeated attempts','Service port','External source'] }, hints: SCENARIOS['ssh-bruteforce'].hints };
    }
  },

  'smtp-exfil': {
    label: 'SMTP Exfiltration',
    hints: heuristics(['Large outbound mail payloads can carry attachments.','Inspect auth and MIME structure, not just headers.','Correlate destination domains and timing.']),
    generate({ difficulty='Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const a = privateIp(prng), ext = publicIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      for(let i=0;i<packetCount - evidenceCount;i++) packets.push(buildDNS({ no:1, timeEpochMs: baseTime + i*140, srcIp:a, dstIp: resolverIp(prng, a), srcPort:ephemeralPort(prng), qname: fqdn(['com','net'], prng) }));
      const ev = [];
      for(let i=0;i<evidenceCount;i++) ev.push(buildSMTP({ no:1, timeEpochMs: baseTime + 1000 + i*120, srcIp:a, dstIp: ext, srcPort: 587, cmd:'DATA', arg:`MIME-Version: 1.0\r\nContent-Type: application/octet-stream; name=\"export_${randInt(100,999,prng)}.zip\"\r\n\r\n[file bytes]` }));
      const all = assignMeta([...packets, ...ev]);
      return { packets: all, groundTruth: { ids: ev.map(p=>p.id), reason:'Outbound SMTP with file-like MIME content', rubric:['MIME','Outbound','Attachment-like'] }, hints: SCENARIOS['smtp-exfil'].hints };
    }
  },

  'icmp-covert': {
    label: 'ICMP Covert Channel',
    hints: heuristics(['Echo requests can carry data in payloads.','Check for consistent sizes and cadence.','Correlate destination stability with payload changes.']),
    generate({ difficulty='Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const a = privateIp(prng), ext = publicIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      for(let i=0;i<packetCount - evidenceCount;i++) packets.push(buildHTTPS({ no:1, timeEpochMs: baseTime + i*170, srcIp:a, dstIp: publicIp(prng), srcPort:ephemeralPort(prng), sni: fqdn(['com','net'], prng) }));
      const ev = [];
      for(let i=0;i<evidenceCount;i++) ev.push(buildICMP({ no:1, timeEpochMs: baseTime + 600 + i*200, srcIp:a, dstIp: ext }));
      const all = assignMeta([...packets, ...ev]);
      return { packets: all, groundTruth: { ids: ev.map(p=>p.id), reason:'ICMP echo traffic carrying payload content', rubric:['Echo payload','Cadence'] }, hints: SCENARIOS['icmp-covert'].hints };
    }
  },

  'https-benign-mix': {
    label: 'HTTPS Benign Mix',
    hints: heuristics(['Not all large transfers are malicious.','Correlate destination reputation and typical usage.','Consider overall capture context.']),
    generate({ difficulty='Beginner', packetCount, evidenceCount, seed }){
      const { prng } = makeSeed();
      const a = privateIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      for(let i=0;i<packetCount;i++) packets.push(buildHTTPS({ no:1, timeEpochMs: baseTime + i*120, srcIp:a, dstIp: publicIp(prng), srcPort:ephemeralPort(prng), sni: fqdn(['com','net','org'], prng) }));
      const all = assignMeta(packets);
      return { packets: all, groundTruth: { ids: [], reason:'Benign traffic only', rubric: [] }, hints: SCENARIOS['https-benign-mix'].hints };
    }
  }
};


