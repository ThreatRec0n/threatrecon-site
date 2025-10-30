import { makeSeed, privateIp, privateIpNear, publicIp, resolverIp, fqdn, randInt, pick, ephemeralPort } from './random-net';
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
function pickEvidenceCount(difficulty) {
  if (difficulty === 'beginner') return randInt(1, 2);
  if (difficulty === 'intermediate') return randInt(2, 4);
  return randInt(3, 7); // Advanced
}

export const SCENARIOS = {
  mixed: {
    label: 'Mixed Investigation',
    hints: heuristics([
      'Evidence often travels from inside to outside during office hours.',
      'Names that look random tend not to be random.',
      'Uploads frequently use POST and carry filenames.',
    ]),
    generate({ difficulty = 'beginner', count = 35 }){
      const { prng } = makeSeed();
      const src = privateIp(prng);
      const sni = fqdn(['com','net','io','org'], prng);
      const ext = publicIp(prng);
      const baseTime = timeBase(prng);
      const packets = [];
      
      // Generate baseline traffic (80% of total)
      const baselineCount = Math.floor(count * 0.8);
      for(let i=0;i<Math.floor(baselineCount*0.5);i++){
        packets.push(buildHTTPS({ no: i+1, timeEpochMs: baseTime + i*200, srcIp: src, dstIp: ext, srcPort: ephemeralPort(prng), sni }));
      }
      for(let i=0;i<Math.floor(baselineCount*0.2);i++){
        packets.push(buildDNS({ no: 1, timeEpochMs: baseTime + i*180, srcIp: src, dstIp: resolverIp(prng, src), srcPort: ephemeralPort(prng), qname: fqdn(['com','net','org'], prng), qtype: pick(['A','AAAA','TXT'], prng) }));
      }
      for(let i=0;i<Math.floor(baselineCount*0.1);i++){
        packets.push(buildHTTP({ no: 1, timeEpochMs: baseTime + i*220, srcIp: src, dstIp: publicIp(prng), srcPort: ephemeralPort(prng), method: 'GET', host: fqdn(['com','net'], prng), uri: '/' }));
      }
      if (count > 30) packets.push(buildICMP({ no: 1, timeEpochMs: baseTime + 111, srcIp: src, dstIp: publicIp(prng) }));
      
      // Generate evidence packets based on difficulty
      const evidenceCount = pickEvidenceCount(difficulty);
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
  'voip-investigation': {
    label: 'VoIP Investigation',
    hints: heuristics(['SIP INVITE contains SDP with RTP ports','G.711 PCMU/PCMA plays at 8 kHz','SRTP cannot be decoded without keys']),
    generate({ difficulty='beginner', count=35 }){
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
      // RTP burst (PCMU PT=0)
      const ssrc = randInt(1,1e9,prng) >>> 0;
      let seq = randInt(1,65000,prng);
      for(let i=0;i<Math.min(12, Math.max(8, Math.floor(count*0.3))); i++){
        packets.push(buildRTP({ no:1, timeEpochMs: baseTime+400+i*20, srcIp:a, dstIp:b, srcPort:16384, dstPort:16384, ssrc, seq: (seq+i)&0xFFFF, pt: 0 }));
      }
      // Mix in a few normal packets
      for(let i=0;i<Math.floor(count*0.2);i++) packets.push(buildDNS({ no:1, timeEpochMs: baseTime + 500 + i*150, srcIp:a, dstIp: resolverIp(prng, a), srcPort: ephemeralPort(prng), qname: fqdn(['com','net'], prng) }));
      for(let i=0;i<Math.floor(count*0.2);i++) packets.push(buildHTTPS({ no:1, timeEpochMs: baseTime + 600 + i*180, srcIp:a, dstIp: ext, srcPort: ephemeralPort(prng), sni: fqdn(['com','net'], prng) }));
      const all = assignMeta(packets);
      return { packets: all, groundTruth: { ids: [], reason: 'Practice call analysis', rubric: [] }, hints: SCENARIOS['voip-investigation'].hints };
    }
  },

  'http-exfil': {
    label: 'HTTP Exfiltration',
    hints: heuristics(['Uploads frequently use POST and carry filenames.', 'Evidence often travels from inside to outside.', 'Streams tell the full story, not a single header.']),
    generate({ difficulty='beginner', count=35 }){
      const { prng } = makeSeed();
      const src = privateIp(prng), ext = publicIp(prng), sni = fqdn(['com','net'], prng);
      const baseTime = timeBase(prng);
      const packets = [];
      
      // Generate baseline traffic
      const baselineCount = count - pickEvidenceCount(difficulty);
      for(let i=0;i<baselineCount;i++) {
        packets.push(buildHTTP({ no:1, timeEpochMs: baseTime + i*200, srcIp: src, dstIp: publicIp(prng), srcPort: ephemeralPort(prng), method: pick(['GET','GET','GET','HEAD'], prng), host: fqdn(['com','net'], prng), uri: '/' }));
      }
      
      // Generate evidence packets
      const evidenceCount = pickEvidenceCount(difficulty);
      const evidencePackets = [];
      for(let i=0; i<evidenceCount; i++) {
        const filename = `client_export_${randInt(100,999,prng)}.xlsx`;
        const body = `------\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n\r\n[file bytes]`;
        evidencePackets.push(buildHTTP({ no:1, timeEpochMs: baseTime + 9999 + i*100, srcIp: src, dstIp: ext, srcPort: ephemeralPort(prng), method:'POST', host: sni, uri:'/upload', headers:{'Content-Type':'multipart/form-data'}, body }));
      }
      
      const all = assignMeta([...packets, ...evidencePackets]);
      return { 
        packets: all, 
        groundTruth: { 
          ids: evidencePackets.map(p=>p.id), 
          reason:'HTTP POST with file upload body', 
          rubric:['File upload body','External destination','POST semantics'] 
        }, 
        hints: SCENARIOS['http-exfil'].hints 
      };
    }
  },
};


