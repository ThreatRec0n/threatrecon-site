import { isValidIp, isPrivate, sameSubnet, isTestNetOrPublic } from './net';

export type DeviceId = 'dmz1'|'dmz2'|'lan1'|'lan2'|'lan_rtr'|'fw'|'wan_gw'|'internet';

export type IfCfg = { ip?: string, mask?: string, gw?: string, dhcp?: boolean };

export type Topology = {
  dmz1: IfCfg, dmz2: IfCfg, lan1: IfCfg, lan2: IfCfg,
  lan_rtr: { ip1?: string, ip2?: string, mask?: string, gw?: string },
  fw: { dmz?: string, lan?: string, wan?: string, natMasq?: boolean, defaultGw?: string },
  wan: { ip1?: string, ip2?: string, gw?: string, dhcp?: 'none'|'ip1'|'ip2' }
};

export function linkState(t: Topology){
  // Whether to draw solid lines (connected) or dashed (not configured)
  return {
    dmz_to_fw: isValidIp(t.dmz1.gw||'') || isValidIp(t.dmz2.gw||''),
    lan_to_fw: isValidIp(t.lan_rtr.gw||'') && isValidIp(t.fw.lan||''),
    fw_to_wan: (t.wan.dhcp!=='none' || (isValidIp(t.wan.ip1||'') || isValidIp(t.wan.ip2||''))) && isValidIp(t.wan.gw||'')
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
  if(sameSubnet(sip!, mask(src)!, dstIp)) return {ok:true};
  
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

