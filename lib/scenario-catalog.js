import { makeSeed, privateIp, publicIp, fqdn, randInt, pick } from './random-net';
import { buildHTTP, buildHTTPS, buildDNS, buildSMB, buildSMTP, buildIMAP, buildFTP, buildICMP, buildRTP } from './packet-factory';

function timeBase(prng){ return Date.now() - randInt(30_000, 300_000, prng); }

function assignMeta(packets){
  // assign packet numbers and timestamps increasing
  const base = packets.length ? packets[0].timeEpochMs : Date.now();
  return packets
    .sort((a,b)=>a.timeEpochMs-b.timeEpochMs)
    .map((p,i)=>({ ...p, no: i+1, timeEpochMs: base + i*randInt(50, 500) }));
}

function heuristics(list){ return list; }

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
      // Baseline HTTPS/DNS/HTTP/ICMP/SMB
      for(let i=0;i<Math.floor(count*0.5);i++){
        packets.push(buildHTTPS({ no: i+1, timeEpochMs: baseTime + i*200, srcIp: src, dstIp: ext, srcPort: randInt(1024,60000,prng), sni }));
      }
      for(let i=0;i<Math.floor(count*0.2);i++){
        packets.push(buildDNS({ no: 1, timeEpochMs: baseTime + i*180, srcIp: src, dstIp: '8.8.8.8', srcPort: randInt(1024,60000,prng), qname: fqdn(['com','net','org'], prng), qtype: pick(['A','AAAA','TXT'], prng) }));
      }
      for(let i=0;i<Math.floor(count*0.1);i++){
        packets.push(buildHTTP({ no: 1, timeEpochMs: baseTime + i*220, srcIp: src, dstIp: publicIp(prng), srcPort: randInt(1024,60000,prng), method: 'GET', host: fqdn(['com','net'], prng), uri: '/' }));
      }
      if (count > 30) packets.push(buildICMP({ no: 1, timeEpochMs: baseTime + 111, srcIp: src, dstIp: publicIp(prng) }));
      // Possible evidence based on difficulty
      let evidencePackets = [];
      const choice = pick(['http_exfil','dns_tunnel','smtp_auth','smb_copy','beacon','rtp'], prng);
      if (choice==='http_exfil'){
        const filename = `payroll_${randInt(1,4,prng)}.xlsx`;
        const body = `------WebKit\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n\r\n[file bytes]`;
        evidencePackets = [buildHTTP({ no: 1, timeEpochMs: baseTime + 9999, srcIp: src, dstIp: ext, srcPort: randInt(1024,60000,prng), method: 'POST', host: sni, uri: '/upload', headers: { 'Content-Type':'multipart/form-data' }, body })];
      } else if (choice==='dns_tunnel'){
        const label = Array.from({length: randInt(40,60,prng)}, ()=>pick('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split(''), prng)).join('');
        const qname = `${label}.${fqdn(['com'], prng)}`;
        evidencePackets = [buildDNS({ no: 1, timeEpochMs: baseTime + 9999, srcIp: src, dstIp: '8.8.8.8', srcPort: randInt(1024,60000,prng), qname, qtype: 'TXT' })];
      } else if (choice==='smtp_auth'){
        const b64 = btoa(`user${randInt(10,99,prng)}:pass${randInt(100,999,prng)}`);
        evidencePackets = [buildSMTP({ no: 1, timeEpochMs: baseTime + 9999, srcIp: src, dstIp: ext, srcPort: randInt(1024,60000,prng), cmd: 'AUTH PLAIN', arg: b64 })];
      } else if (choice==='smb_copy'){
        evidencePackets = [buildSMB({ no: 1, timeEpochMs: baseTime + 9999, srcIp: src, dstIp: privateIp(prng), srcPort: randInt(1024,60000,prng), op: 'Write', path: `\\\\10.0.${randInt(0,255,prng)}.${randInt(1,254,prng)}\\finance\\payroll.xlsx` })];
      } else if (choice==='beacon'){
        for(let i=0;i<3;i++) packets.push(buildHTTPS({ no: 1, timeEpochMs: baseTime + 7000 + i*30000, srcIp: src, dstIp: ext, srcPort: randInt(1024,60000,prng), sni }));
        evidencePackets = [packets[packets.length-1]];
      } else if (choice==='rtp'){
        evidencePackets = [buildRTP({ no: 1, timeEpochMs: baseTime + 9999, srcIp: src, dstIp: publicIp(prng), srcPort: 16384, dstPort: 16384, ssrc: randInt(1,1e6,prng), seq: randInt(1,65535,prng), pt: 0 })];
      }
      const all = assignMeta([...packets, ...evidencePackets]);
      return {
        packets: all,
        groundTruth: { ids: evidencePackets.map(p=>p.id), reason: 'Scenario evidence packet(s) embedded in realistic traffic', rubric: ['Directionality/context', 'Protocol semantics', 'Content indicates misuse'] },
        hints: SCENARIOS.mixed.hints,
      };
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
      for(let i=0;i<count-1;i++) packets.push(buildHTTP({ no:1, timeEpochMs: baseTime + i*200, srcIp: src, dstIp: publicIp(prng), srcPort: randInt(1024,60000,prng), method: pick(['GET','GET','GET','HEAD'], prng), host: fqdn(['com','net'], prng), uri: '/' }));
      const filename = `client_export_${randInt(100,999,prng)}.xlsx`;
      const body = `------\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\n\r\n[file bytes]`;
      const ev = buildHTTP({ no:1, timeEpochMs: baseTime + 9999, srcIp: src, dstIp: ext, srcPort: randInt(1024,60000,prng), method:'POST', host: sni, uri:'/upload', headers:{'Content-Type':'multipart/form-data'}, body });
      const all = assignMeta([...packets, ev]);
      return { packets: all, groundTruth: { ids:[ev.id], reason:'HTTP POST with file upload body', rubric:['File upload body','External destination','POST semantics'] }, hints: SCENARIOS['http-exfil'].hints };
    }
  },
};


