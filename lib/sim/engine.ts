import { inSameSubnet, subnetContains } from "./ip";
import type { Scenario, Host, Firewall } from "./types";
function ruleAllows(fw: Firewall, proto: "ICMP"|"DNS"|"HTTP"|"ANY", src: string, dst: string, inIface?: "dmz"|"lan"|"wan"): boolean {
  for (const r of fw.rules) {
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
export type PingResult = { success: boolean; hops: string[]; reason?: string };
export function pingFromHost(scn: Scenario, host: Host, targetIp: string, fw: Firewall): PingResult {
  if (!inSameSubnet(host.ip, host.gw, host.mask)) {
    return { success: false, hops: [host.ip], reason: "Host and gateway not in same subnet" };
  }
  let inIface: "lan"|"dmz"|"wan" | undefined;
  if (subnetContains(scn.subnets.lan.cidr, host.ip)) inIface = "lan";
  else if (subnetContains(scn.subnets.dmz.cidr, host.ip)) inIface = "dmz";
  const hops: string[] = [host.ip];
  if (!ruleAllows(fw, "ICMP", host.ip, (fw.ifaces as any)[inIface!], inIface)) {
    return { success: false, hops, reason: "Firewall rule blocks ICMP on ingress" };
  }
  hops.push((fw.ifaces as any)[inIface!]);
  const goingInternet = !subnetContains(scn.subnets.lan.cidr, targetIp) && !subnetContains(scn.subnets.dmz.cidr, targetIp);
  if (goingInternet) {
    if (!fw.nat.snat) return { success: false, hops, reason: "Missing SNAT for outbound Internet" };
    if (!ruleAllows(fw, "ICMP", fw.ifaces.wan, scn.subnets.wan.gw, "wan")) {
      return { success: false, hops, reason: "Firewall rule blocks WAN egress ICMP" };
    }
    hops.push(fw.ifaces.wan, scn.subnets.wan.gw, targetIp);
    return { success: targetIp === scn.internet.pingTarget, hops };
  } else {
    const dstIsLan = subnetContains(scn.subnets.lan.cidr, targetIp);
    const outIface = dstIsLan ? "lan" : "dmz";
    if (!ruleAllows(fw, "ICMP", (fw.ifaces as any)[outIface], targetIp, outIface)) {
      return { success: false, hops, reason: "Firewall rule blocks inter-zone ICMP" };
    }
    hops.push((fw.ifaces as any)[outIface], targetIp);
    return { success: true, hops };
  }
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
export function hopsToNodes(hops: string[], scn: Scenario): Array<"LAN1"|"FW"|"WAN_ROUTER"|"INTERNET"|"DMZ1"|"DMZ2"|"LAN2"> {
  const out: Array<"LAN1"|"FW"|"WAN_ROUTER"|"INTERNET"|"DMZ1"|"DMZ2"|"LAN2"> = [];
  for (const h of hops) {
    if (h === scn.devices.router.wan || h === scn.subnets.wan.gw) out.push("WAN_ROUTER");
    else if (h === scn.internet.pingTarget) out.push("INTERNET");
    else if (h === scn.devices.firewall.ifaces.lan || h === scn.devices.firewall.ifaces.dmz || h === scn.devices.firewall.ifaces.wan) out.push("FW");
    else if (h === scn.devices.lanHosts[0].ip) out.push("LAN1");
    else if (h === scn.devices.lanHosts[1].ip) out.push("LAN2");
    else if (h === scn.devices.dmzHosts[0].ip) out.push("DMZ1");
    else if (h === scn.devices.dmzHosts[1].ip) out.push("DMZ2");
  }
  return out;
}