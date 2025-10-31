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

export function pingFromHost(scn: Scenario, host: Host, targetIp: string, fw: Firewall): PingResult {
  const hops: string[] = [host.ip];

  // Validate input IPs
  if (!isValidIp(host.ip)) {
    return { success: false, hops, reason: "invalid host IP address format" };
  }
  if (!isValidIp(targetIp)) {
    return { success: false, hops, reason: "invalid target IP address format" };
  }

  // 1) Host -> LAN router (must be same /24 and GW points to LAN router)
  if (!inSame24(host.ip, scn.devices.lanRouter.lanIp)) {
    return { success: false, hops, reason: "host IP must be in same /24 subnet as LAN router" };
  }
  if (!isValidIp(host.gw)) {
    return { success: false, hops, reason: "invalid gateway IP address format" };
  }
  if (host.gw !== scn.devices.lanRouter.lanIp) {
    return { success: false, hops, reason: "host gateway must point to LAN router IP" };
  }
  hops.push(scn.devices.lanRouter.lanIp);

  // 2) LAN router default route must be firewall.lan
  if (!isValidIp(scn.devices.lanRouter.gw)) {
    return { success: false, hops, reason: "LAN router gateway must be a valid IP" };
  }
  if (scn.devices.lanRouter.gw !== scn.devices.firewall.ifaces.lan) {
    return { success: false, hops, reason: "LAN router gateway must point to firewall LAN interface" };
  }
  hops.push(scn.devices.firewall.ifaces.lan);

  // 3) Firewall policy: need explicit ALLOW rules for both ingress and egress
  const allow = allowEgressICMP(fw, host.ip, targetIp);
  if (!allow) {
    return { success: false, hops, reason: "firewall rules must ALLOW ICMP on LAN ingress and WAN egress" };
  }

  // 4) SNAT must be configured correctly
  if (!fw.nat?.snat) {
    return { success: false, hops, reason: "SNAT must be configured for Internet access" };
  }
  if (!isValidCidr(fw.nat.snat.srcCidr)) {
    return { success: false, hops, reason: "SNAT source CIDR must be valid (e.g., 192.168.1.0/24)" };
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
  // Verify SNAT translate-to matches firewall WAN IP
  if (fw.nat.snat.toIp !== scn.devices.firewall.ifaces.wan) {
    return { success: false, hops, reason: "SNAT must translate to firewall WAN IP" };
  }
  hops.push(scn.devices.firewall.ifaces.wan);

  // 5) Through WAN gateway to Internet
  hops.push(scn.subnets.wan.gw);
  
  // 6) Final destination validation
  if (targetIp !== scn.internet.pingTarget) {
    return { success: false, hops, reason: "target IP does not match configured Internet target" };
  }
  
  hops.push(targetIp);
  return { success: true, hops };
}
export function tracerouteFromHost(scn: Scenario, host: Host, targetIp: string, fw: Firewall): { hops: string[], reached: boolean } {
  const pr = pingFromHost(scn, host, targetIp, fw);
  return { hops: pr.hops, reached: pr.success };
}
export function nslookupHost(scn: Scenario, host: Host, name: string): { answer?: string } {
  const ip = scn.internet.dns[name];
  return ip ? { answer: ip } : {};
}

/** Map ping hops to diagram node keys for animation */
export function hopsToNodes(hops: string[], scn: Scenario): Array<"LAN1"|"FW"|"WAN_ROUTER"|"INTERNET"|"DMZ1"|"DMZ2"|"LAN2"|"LAN_ROUTER"> {
  const out: Array<"LAN1"|"FW"|"WAN_ROUTER"|"INTERNET"|"DMZ1"|"DMZ2"|"LAN2"|"LAN_ROUTER"> = [];
  for (const h of hops) {
    if (h === scn.devices.router.wan || h === scn.subnets.wan.gw) out.push("WAN_ROUTER");
    else if (h === scn.internet.pingTarget) out.push("INTERNET");
    else if (h === scn.devices.firewall.ifaces.lan || h === scn.devices.firewall.ifaces.dmz || h === scn.devices.firewall.ifaces.wan) out.push("FW");
    else if (h === scn.devices.lanRouter.lanIp) out.push("LAN_ROUTER");
    else if (h === scn.devices.lanHosts[0].ip) out.push("LAN1");
    else if (h === scn.devices.lanHosts[1].ip) out.push("LAN2");
    else if (h === scn.devices.dmzHosts[0].ip) out.push("DMZ1");
    else if (h === scn.devices.dmzHosts[1].ip) out.push("DMZ2");
  }
  return out;
}