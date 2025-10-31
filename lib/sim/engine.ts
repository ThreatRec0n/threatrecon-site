import { inSameSubnet, subnetContains } from "./ip";
import type { Scenario, Host, Firewall } from "./types";
function ruleAllows(fw: Firewall, proto: "ICMP"|"DNS"|"HTTP"|"ANY", src: string, dst: string, inIface?: "dmz"|"lan"|"wan"): boolean {
  for (const r of (fw.rules || [])) {
    const protoOk = r.proto === "ANY" || r.proto === proto;
    const srcOk = matchCidrOrIp(r.src, src);
    const dstOk = matchCidrOrIp(r.dst, dst);
    const ifaceOk = r.inIface ? r.inIface === inIface : true;
    if (protoOk && srcOk && dstOk && ifaceOk) return r.action === "ALLOW";
  }
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
function allowEgressICMP(fw: Firewall): boolean {
  return !!fw.rules?.some(r=>r.action==="ALLOW" && (r.proto==="ICMP"||r.proto==="ANY") && r.src!=="DENY");
}
export type PingResult = { success: boolean; hops: string[]; reason?: string };
export function pingFromHost(scn: Scenario, host: Host, targetIp: string, fw: Firewall): PingResult {
  const hops: string[] = [host.ip]; // LAN host

  // 1) Host -> LAN router (must be same /24 and GW points to LAN router)
  if (!inSame24(host.ip, scn.devices.lanRouter.lanIp) || host.gw !== scn.devices.lanRouter.lanIp) {
    return { success: false, hops, reason: "invalid gateway" };
  }
  hops.push(scn.devices.lanRouter.lanIp); // LAN router

  // 2) LAN router default route must be firewall.lan
  if (scn.devices.lanRouter.gw !== scn.devices.firewall.ifaces.lan) {
    return { success: false, hops, reason: "lan router not routed to firewall" };
  }
  hops.push(scn.devices.firewall.ifaces.lan); // Firewall (LAN if)

  // 3) Firewall policy: need ALLOW ICMP egress and SNAT out WAN for LAN subnet
  const allow = allowEgressICMP(fw);
  const hasSnat = !!fw.nat?.snat && fw.nat!.snat!.outIface==="wan" && fw.nat!.snat!.srcCidr.startsWith("192.168.1.");
  if (!allow) return { success:false, hops, reason: "firewall blocks ICMP" };
  if (!hasSnat) return { success:false, hops, reason: "missing SNAT" };

  // 4) Through WAN gateway to Internet
  hops.push(scn.devices.firewall.ifaces.wan);
  hops.push(scn.subnets.wan.gw);
  if (targetIp === scn.internet.pingTarget) {
    hops.push(targetIp);
    return { success: true, hops };
  }
  return { success: false, hops, reason: "unknown target" };
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