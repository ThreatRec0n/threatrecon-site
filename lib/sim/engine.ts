import { inSameSubnet, subnetContains } from "./ip";
import type { Scenario, Host, Firewall } from "./types";
function ruleAllows(fw: Firewall, proto: "ICMP"|"DNS"|"HTTP"|"ANY", src: string, dst: string, inIface?: "dmz"|"lan"|"wan"): boolean {
  // Default deny - explicit rules required
  if (!fw.rules || fw.rules.length === 0) return false;
  
  // Check rules in order (first match wins)
  for (const r of fw.rules) {
    // Skip disabled rules
    if (r.action === "DENY") continue;
    
    // Protocol must match exactly or be ANY
    const protoOk = r.proto === "ANY" || r.proto === proto;
    if (!protoOk) continue;
    
    // Source must match
    const srcOk = matchCidrOrIp(r.src, src);
    if (!srcOk) continue;
    
    // Destination must match
    const dstOk = matchCidrOrIp(r.dst, dst);
    if (!dstOk) continue;
    
    // Interface must match if specified
    const ifaceOk = !r.inIface || r.inIface === inIface;
    if (!ifaceOk) continue;
    
    // All conditions met - allow
    return r.action === "ALLOW";
  }
  
  // No matching rule found - default deny
  return false;
}
function matchCidrOrIp(pattern: string, ip: string): boolean {
  if (pattern.includes("/")) return subnetContains(pattern, ip);
  return pattern === "ANY" || pattern === ip;
}
function inSame24(a: string, b: string): boolean {
  const toNum = (ip: string) => ip.split(".").map(n=>+n);
  const [a1,a2,a3] = toNum(a), [b1,b2,b3] = toNum(b);
  return a1===b1 && a2===b2 && a3===b3;
}
function allowEgressICMP(fw: Firewall, srcIp: string, dstIp: string): boolean {
  // Need explicit rule allowing ICMP from source to destination
  // Check both LAN ingress (to firewall) and WAN egress (from firewall)
  
  // For LAN -> Firewall (ingress on LAN interface)
  const lanRule = ruleAllows(fw, "ICMP", srcIp, fw.ifaces.lan, "lan");
  
  // For Firewall -> Internet (egress on WAN interface)
  const wanRule = ruleAllows(fw, "ICMP", fw.ifaces.wan, dstIp, "wan");
  
  // Both must be allowed
  return lanRule && wanRule;
}
export type PingResult = { success: boolean; hops: string[]; reason?: string };
// Validate IP address format (strict)
function isValidIp(ip: string): boolean {
  const parts = ip.split(".");
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && p === String(n);
  });
}

// Validate CIDR notation
function isValidCidr(cidr: string): boolean {
  const [ip, prefix] = cidr.split("/");
  if (!isValidIp(ip)) return false;
  const prefixNum = parseInt(prefix, 10);
  return !isNaN(prefixNum) && prefixNum >= 0 && prefixNum <= 32;
}

export function pingFromHost(
  scn: Scenario, 
  host: Host, 
  targetIp: string, 
  fw: Firewall,
  lanRouter?: { lanIp: string; gw: string }
): PingResult {
  const hops: string[] = [host.ip];

  // Validate input IPs - all must be configured
  if (!host.ip || !isValidIp(host.ip)) {
    return { success: false, hops, reason: "host IP address must be configured and valid" };
  }
  // Enforce private LAN ranges for host
  const firstOctet = parseInt(host.ip.split(".")[0] || "0", 10);
  const isPrivate = host.ip.startsWith("10.") || (host.ip.startsWith("172.") && (()=>{ const s=parseInt(host.ip.split(".")[1]||"0",10); return s>=16 && s<=31; })()) || host.ip.startsWith("192.168.");
  if (!isPrivate) {
    return { success: false, hops, reason: "host IP must be from a private range (10.x, 172.16-31.x, 192.168.x)" };
  }
  if (!targetIp || !isValidIp(targetIp)) {
    return { success: false, hops, reason: "target IP address must be configured and valid" };
  }
  if (!host.gw || !isValidIp(host.gw)) {
    return { success: false, hops, reason: "host gateway must be configured and valid" };
  }

  // LAN router must be configured
  if (!lanRouter || !lanRouter.lanIp) {
    return { success: false, hops, reason: "LAN router IP must be configured" };
  }
  if (!isValidIp(lanRouter.lanIp)) {
    return { success: false, hops, reason: "LAN router IP format is invalid" };
  }
  if (!lanRouter.lanIp.startsWith("192.168.")) {
    return { success: false, hops, reason: "LAN router must use 192.168.x.x for this scenario" };
  }

  // 1) Host -> LAN router (must be same /24 and GW points to LAN router)
  if (!inSame24(host.ip, lanRouter.lanIp)) {
    return { success: false, hops, reason: "host IP must be in same /24 subnet as LAN router (first 3 octets must match)" };
  }
  if (host.gw !== lanRouter.lanIp) {
    return { success: false, hops, reason: "host gateway must point to LAN router IP" };
  }
  hops.push(lanRouter.lanIp);

  // 2) LAN router default route must be firewall.lan
  if (!lanRouter.gw || !isValidIp(lanRouter.gw)) {
    return { success: false, hops, reason: "LAN router gateway must be configured and valid" };
  }
  if (!fw.ifaces.lan || !isValidIp(fw.ifaces.lan)) {
    return { success: false, hops, reason: "firewall LAN interface must be configured and valid" };
  }
  if (lanRouter.gw !== fw.ifaces.lan) {
    return { success: false, hops, reason: "LAN router gateway must point to firewall LAN interface IP" };
  }
  hops.push(fw.ifaces.lan);

  // 3) Firewall policy: need explicit ALLOW rules for both ingress and egress
  const allow = allowEgressICMP(fw, host.ip, targetIp);
  if (!allow) {
    return { success: false, hops, reason: "firewall rules must ALLOW ICMP on LAN ingress and WAN egress" };
  }

  // 4) NAT must be configured correctly (SNAT or Masquerade)
  const translation = fw.nat?.translation || (fw.nat?.snat ? 'snat' : 'masquerade');
  
  if (translation === 'none' || (!fw.nat?.snat && translation !== 'masquerade')) {
    return { success: false, hops, reason: "NAT must be configured (SNAT or Masquerade) for Internet access" };
  }
  
  // For masquerade, use egress interface IP dynamically
  if (translation === 'masquerade') {
    // Masquerade uses the WAN interface IP as the source
    if (!fw.ifaces.wan || !isValidIp(fw.ifaces.wan)) {
      return { success: false, hops, reason: "firewall WAN interface must be configured for masquerade" };
    }
    // Masquerade doesn't require explicit source CIDR matching, but we can validate the interface
  } else if (translation === 'snat' && fw.nat?.snat) {
    // Static SNAT validation
    if (!isValidCidr(fw.nat.snat.srcCidr)) {
      return { success: false, hops, reason: "SNAT source CIDR must be valid (e.g., 192.168.1.0/24)" };
    }
    // Enforce mask /24 for simplicity in this training scenario
    if (!fw.nat.snat.srcCidr.endsWith("/24")) {
      return { success: false, hops, reason: "SNAT source must be a /24 network in this scenario" };
    }
    if (!isValidIp(fw.nat.snat.toIp)) {
      return { success: false, hops, reason: "SNAT translate-to IP must be valid" };
    }
    if (fw.nat.snat.outIface !== "wan") {
      return { success: false, hops, reason: "SNAT must use WAN interface" };
    }
    // Verify SNAT source CIDR matches host subnet
    if (!subnetContains(fw.nat.snat.srcCidr, host.ip)) {
      return { success: false, hops, reason: "SNAT source CIDR must include host IP" };
    }
    // Firewall WAN interface must be configured
    if (!fw.ifaces.wan || !isValidIp(fw.ifaces.wan)) {
      return { success: false, hops, reason: "firewall WAN interface must be configured and valid" };
    }
    // Verify SNAT translate-to matches firewall WAN IP
    if (fw.nat.snat.toIp !== fw.ifaces.wan) {
      return { success: false, hops, reason: "SNAT must translate to firewall WAN IP" };
    }
  }
  hops.push(fw.ifaces.wan);

  // 5) Through WAN gateway to Internet
  hops.push(scn.subnets.wan.gw);
  
  // 6) Final destination validation
  if (targetIp !== scn.internet.pingTarget) {
    return { success: false, hops, reason: "target IP does not match configured Internet target" };
  }
  
  hops.push(targetIp);
  return { success: true, hops };
}
export function tracerouteFromHost(
  scn: Scenario, 
  host: Host, 
  targetIp: string, 
  fw: Firewall,
  lanRouter?: { lanIp: string; gw: string }
): { hops: string[], reached: boolean } {
  const pr = pingFromHost(scn, host, targetIp, fw, lanRouter);
  return { hops: pr.hops, reached: pr.success };
}
export function nslookupHost(scn: Scenario, host: Host, name: string): { answer?: string } {
  const ip = scn.internet.dns[name];
  return ip ? { answer: ip } : {};
}

/** Map ping hops to diagram node keys for animation */
export function hopsToNodes(
  hops: string[], 
  scn: Scenario,
  lanRouter?: { lanIp: string },
  lanHost1Ip?: string,
  fw?: { ifaces: { lan: string; dmz: string; wan: string } }
): Array<"LAN1"|"FW"|"WAN_ROUTER"|"INTERNET"|"DMZ1"|"DMZ2"|"LAN2"|"LAN_ROUTER"> {
  const out: Array<"LAN1"|"FW"|"WAN_ROUTER"|"INTERNET"|"DMZ1"|"DMZ2"|"LAN2"|"LAN_ROUTER"> = [];
  for (const h of hops) {
    if (h === scn.devices.router.wan || h === scn.subnets.wan.gw) out.push("WAN_ROUTER");
    else if (h === scn.internet.pingTarget) out.push("INTERNET");
    else if (fw && (h === fw.ifaces.lan || h === fw.ifaces.dmz || h === fw.ifaces.wan)) out.push("FW");
    else if (lanRouter && h === lanRouter.lanIp) out.push("LAN_ROUTER");
    else if (lanHost1Ip && h === lanHost1Ip) out.push("LAN1");
    // Try to match based on IP patterns if exact match fails
    else if (h.startsWith("192.168.1.") && hops.indexOf(h) < 3) out.push("LAN1");
    else if (h.startsWith("192.168.1.")) out.push("LAN_ROUTER");
    else if (h.startsWith("10.10.10.")) out.push("DMZ1");
  }
  return out;
}

// Helper to resolve hostnames to IPs
function resolveHost(s: string, scn: Scenario): string {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return s;
  // Check scenario DNS
  if (scn.internet.dns[s]) return scn.internet.dns[s];
  // Minimal mock DNS
  if (s === "internet" || s.endsWith(".example")) return scn.internet.pingTarget || "203.0.113.1";
  return "198.51.100.1";
}

export type SimSource = { kind:"dmz"|"lan"|"fw"|"wan"; id:string };

export type TopologyState = {
  scenario: Scenario;
  hosts: { lan: Host[]; dmz: Host[] };
  lanRouter: { lanIp: string; gw: string };
  firewall: Firewall;
  wanRouter?: { ip1: string; ip2: string; gw: string };
};

function getNodeById(state: TopologyState, source: SimSource): { ip: string; subnet: string; interface: string; zone: string } | null {
  if (source.kind === "lan" && source.id === "LAN1") {
    const host = state.hosts.lan.find(h => h.id === "lan1");
    if (host?.ip) return { ip: host.ip, subnet: "192.168.1.0/24", interface: host.nic, zone: "lan" };
  }
  if (source.kind === "lan" && source.id === "LAN2") {
    const host = state.hosts.lan.find(h => h.id === "lan2");
    if (host?.ip) return { ip: host.ip, subnet: "192.168.1.0/24", interface: host.nic, zone: "lan" };
  }
  if (source.kind === "lan" && source.id === "lan_rtr") {
    if (state.lanRouter?.lanIp) return { ip: state.lanRouter.lanIp, subnet: "192.168.1.0/24", interface: "lan0", zone: "lan" };
  }
  if (source.kind === "dmz") {
    const host = state.hosts.dmz.find(h => h.id === source.id.toLowerCase());
    if (host?.ip) return { ip: host.ip, subnet: "10.10.10.0/24", interface: host.nic, zone: "dmz" };
  }
  if (source.kind === "fw" && source.id === "firewall") {
    if (state.firewall.ifaces.wan) return { ip: state.firewall.ifaces.wan, subnet: "203.0.113.0/24", interface: "wan", zone: "wan" };
  }
  if (source.kind === "wan" && source.id === "wan_rtr") {
    if (state.wanRouter?.ip1) return { ip: state.wanRouter.ip1, subnet: "203.0.113.0/24", interface: "wan0", zone: "wan" };
  }
  return null;
}

function simulatePath(
  state: TopologyState,
  srcNode: { ip: string; subnet: string; interface: string; zone: string },
  dst: string,
  options: { icmp: boolean }
): { reachable: boolean; hops: string[]; blockedAt?: string } {
  // Use existing pingFromHost logic for LAN hosts
  if (srcNode.zone === "lan" && srcNode.ip) {
    const host: Host = state.hosts.lan.find(h => h.ip === srcNode.ip) || { id: "", nic: srcNode.interface, ip: srcNode.ip, mask: "", gw: "" };
    const result = pingFromHost(state.scenario, host, dst, state.firewall, state.lanRouter);
    return { reachable: result.success, hops: result.hops, blockedAt: result.reason };
  }
  
  // For firewall/WAN/DMZ sources, use simplified logic
  if (srcNode.zone === "fw" || srcNode.zone === "wan") {
    // Direct egress - check firewall rules if needed
    if (state.firewall.rules && state.firewall.rules.length > 0) {
      const allows = ruleAllows(state.firewall, "ICMP", srcNode.ip, dst, srcNode.zone === "wan" ? "wan" : undefined);
      if (!allows) return { reachable: false, hops: [srcNode.ip], blockedAt: "firewall (ACL)" };
    }
    // For WAN, can reach internet directly
    if (srcNode.zone === "wan") {
      return { reachable: true, hops: [srcNode.ip, dst] };
    }
    // For firewall, need WAN gateway
    if (srcNode.zone === "fw" && state.wanRouter?.gw) {
      return { reachable: true, hops: [srcNode.ip, state.wanRouter.gw, dst] };
    }
  }
  
  if (srcNode.zone === "dmz") {
    // DMZ hosts go through firewall
    const host: Host = state.hosts.dmz.find(h => h.ip === srcNode.ip) || { id: "", nic: srcNode.interface, ip: srcNode.ip, mask: "", gw: "" };
    if (state.firewall.ifaces.dmz && host.gw === state.firewall.ifaces.dmz) {
      const hops = [srcNode.ip, state.firewall.ifaces.dmz];
      if (state.firewall.rules && state.firewall.rules.length > 0) {
        const allows = ruleAllows(state.firewall, "ICMP", srcNode.ip, dst, "dmz");
        if (!allows) return { reachable: false, hops, blockedAt: "firewall (ACL)" };
      }
      if (state.firewall.ifaces.wan && state.wanRouter?.gw) {
        hops.push(state.firewall.ifaces.wan, state.wanRouter.gw, dst);
        return { reachable: true, hops };
      }
    }
    return { reachable: false, hops: [srcNode.ip], blockedAt: "routing" };
  }
  
  return { reachable: false, hops: [srcNode.ip], blockedAt: "not implemented" };
}

export async function execCommandFrom(
  source: SimSource,
  cmd: "ping" | "traceroute",
  args: string[],
  state: TopologyState
): Promise<string[]> {
  const dstRaw = args[0];
  if (!dstRaw) return ["error: destination required"];
  
  const dst = resolveHost(dstRaw, state.scenario);
  const srcNode = getNodeById(state, source);
  
  if (!srcNode) return ["error: source not found or not configured"];
  
  const result = simulatePath(state, srcNode, dst, { icmp: true });
  
  if (cmd === "ping") {
    return result.reachable
      ? [
          `PING ${dst}: icmp_seq=1 ttl=${result.hops.length ? 64 - result.hops.length : 62} time=${Math.max(1, result.hops.length)}ms`,
          `--- ${dst} ping statistics ---`,
          `1 packets transmitted, 1 received, 0% packet loss`,
        ]
      : [
          `PING ${dst}: icmp_seq=1`,
          `From ${result.blockedAt || "unknown"} icmp_seq=1 Destination Host Unreachable`,
          `--- ${dst} ping statistics ---`,
          `1 packets transmitted, 0 received, 100% packet loss`,
        ];
  }
  
  // traceroute
  const lines = [`traceroute to ${dst} (${dst}), 30 hops max`];
  result.hops.forEach((h, i) => lines.push(`${i + 1}  ${h} ${i === 0 ? "(source)" : ""}`));
  if (!result.reachable) lines.push(`* * *  (blocked at ${result.blockedAt || "unknown"})`);
  return lines;
}