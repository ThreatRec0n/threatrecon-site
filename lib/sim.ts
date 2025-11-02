import { isValidIp, isPrivate, sameSubnet, isTestNetOrPublic, gwInSubnet } from './net';

export type DeviceId = 'dmz1'|'dmz2'|'lan1'|'lan2'|'lan_rtr'|'fw'|'wan_gw'|'internet';

export type IfCfg = { ip?: string, mask?: string, gw?: string, dhcp?: boolean, committed?: boolean };

export type Topology = {
  dmz1: IfCfg, dmz2: IfCfg, lan1: IfCfg, lan2: IfCfg,
  lan_rtr: { ip1?: string, ip2?: string, mask?: string, gw?: string, committed?: boolean },
  fw: { dmz?: string, lan?: string, wan?: string, natMasq?: boolean, defaultGw?: string, committed?: boolean },
  wan: { ip1?: string, ip2?: string, gw?: string, dhcp?: 'none'|'ip1'|'ip2', committed?: boolean }
};

export type PathCheck = 'local' | 'via_fw' | 'via_internet';

export type Host = { ip: string, mask: string, gw?: string, committed: boolean };

export function canPing(a: Host, b: Host, context: Topology): {ok: boolean, path?: PathCheck} {
  if (!a.committed || !b.committed) return { ok: false };
  
  // Local link: same subnet
  if (sameSubnet(a.ip, b.ip, a.mask)) return { ok: true, path: 'local' };

  // step 1: host has a valid default gateway in its subnet
  if (!gwInSubnet(a.ip, a.mask, a.gw)) return { ok: false };

  // step 2: path to firewall
  const fw = context.fw;
  const lanSide = { ip: fw.lan || '', mask: '255.255.255.0' };
  const wanSide = { ip: fw.wan || '', mask: '255.255.255.0' };
  const dmzSide = { ip: fw.dmz || '', mask: '255.255.255.0' };

  // Check if host can reach firewall (on LAN side, DMZ side, or WAN side)
  const aToFw =
    (isValidIp(lanSide.ip) && sameSubnet(a.ip, lanSide.ip, a.mask)) ||
    (isValidIp(dmzSide.ip) && sameSubnet(a.ip, dmzSide.ip, a.mask));

  if (!aToFw) return { ok: false };

  // step 3: routing through fw to target subnet or internet
  // If target is in same subnet as firewall DMZ or LAN interfaces, route via firewall
  if ((isValidIp(dmzSide.ip) && sameSubnet(b.ip, dmzSide.ip, b.mask || '255.255.255.0')) || 
      (isValidIp(lanSide.ip) && sameSubnet(b.ip, lanSide.ip, b.mask || '255.255.255.0'))) {
    return { ok: true, path: 'via_fw' };
  }

  // internet reachability
  const wanRtr = context.wan;
  const wanIp = wanRtr.dhcp === 'ip1' ? '172.31.0.1' : (wanRtr.dhcp === 'ip2' ? '203.0.113.3' : (wanRtr.ip1 || wanRtr.ip2));
  const fwToWan = isValidIp(wanSide.ip) && isValidIp(wanIp||'') && sameSubnet(wanSide.ip, wanIp, '255.255.255.0');
  const natOn = context.fw.natMasq;
  if (fwToWan && natOn) return { ok: true, path: 'via_internet' };

  return { ok: false };
}

export function linkState(t: Topology){
  // Whether to draw solid lines (connected) or dashed (not configured)
  const wanIp = t.wan.dhcp === 'ip1' ? '172.31.0.1' : (t.wan.dhcp === 'ip2' ? '203.0.113.3' : (t.wan.ip1 || t.wan.ip2));
  return {
    dmz_to_fw: isValidIp(t.dmz1.gw||'') || isValidIp(t.dmz2.gw||''),
    lan_to_fw: isValidIp(t.lan_rtr.gw||'') && isValidIp(t.fw.lan||''),
    fw_to_wan: isValidIp(t.fw.wan||'') && isValidIp(wanIp||'') && sameSubnet(t.fw.wan||'', wanIp, '255.255.255.0')
  };
}

export function routeExists(t: Topology, src: DeviceId, dstIp: string): {ok:boolean, reason?:string} {
  if(!isValidIp(dstIp)) return {ok:false, reason:'Invalid destination IP'};
  
  // local targets on same subnet (hosts -> hosts)
  const hostIp = (d:DeviceId) => {
    if(d==='dmz1') return t.dmz1.ip;
    if(d==='dmz2') return t.dmz2.ip;
    if(d==='lan1') return t.lan1.ip;
    if(d==='lan2') return t.lan2.ip;
    if(d==='lan_rtr') return t.lan_rtr.ip1;
    if(d==='fw') return t.fw.lan; // treat FW lan ip for local checks
    if(d==='wan_gw') return t.wan.ip1 || t.wan.ip2;
    return undefined;
  };
  
  const mask = (d:DeviceId) => {
    if(d==='dmz1' || d==='dmz2') return t.dmz1.mask || t.dmz2.mask;
    if(d==='lan1' || d==='lan2' || d==='lan_rtr') return t.lan_rtr.mask;
    return '255.255.255.0';
  };
  
  const sip = hostIp(src);
  if(!isValidIp(sip||'')) return {ok:false, reason:'Source has no IP'};
  
  // Same-subnet success
  if(sameSubnet(sip!, dstIp, mask(src)!)) return {ok:true};
  
  // Default route pathing
  // LAN/DMZ -> FW
  const srcGw = (():string|undefined=>{
    if(src==='lan1'||src==='lan2') return t.lan_rtr.gw;
    if(src==='dmz1') return t.dmz1.gw;
    if(src==='dmz2') return t.dmz2.gw;
    if(src==='lan_rtr') return t.lan_rtr.gw;
    if(src==='fw') return t.fw.defaultGw;
    return undefined;
  })();
  
  if(!isValidIp(srcGw||'')) return {ok:false, reason:'Missing gateway'};
  
  // FW to WAN / Internet
  const goingInternet = !isPrivate(dstIp);
  if(goingInternet){
    if(!isValidIp(t.fw.wan||'')) return {ok:false, reason:'FW WAN not set'};
    const wanOk = (t.wan.dhcp!=='none') || isValidIp((t.wan.ip1||t.wan.ip2||''));
    if(!wanOk || !isValidIp(t.wan.gw||'')) return {ok:false, reason:'WAN uplink missing'};
    if(!t.fw.natMasq) return {ok:false, reason:'NAT masquerade disabled'};
    return {ok:true};
  }
  
  // Private destination: require correct intermediate gateways; assume FW routes between LAN<->DMZ when both legs configured
  const interVlan = (isPrivate(dstIp) && (isValidIp(t.fw.lan||'') && isValidIp(t.fw.dmz||'')));
  return interVlan ? {ok:true} : {ok:false, reason:'No routed path'};
}

export function simulatePing(t:Topology, src:DeviceId, dst:string){
  const r = routeExists(t, src, dst);
  if(!r.ok) return [`PING ${dst}: host unreachable (${r.reason})`];
  
  // Fake latency + ttl
  return [
    `PING ${dst}: icmp_seq=1 time=12.3 ms`,
    `--- ${dst} ping statistics ---`,
    `1 packets transmitted, 1 received, 0% packet loss`
  ];
}

