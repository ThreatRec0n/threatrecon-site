import { subnetContains } from "./ip";

export function cidrMatch(ip: string, cidrOrAny: string): boolean {
  if (!ip || !cidrOrAny) return false;
  if (cidrOrAny.toLowerCase() === 'any') return true;
  if (!cidrOrAny.includes('/')) return ip === cidrOrAny;
  return subnetContains(cidrOrAny, ip);
}

// simple deterministic DHCP for simulation: pick .2 for ip1 or .3 for ip2
export function simulateDhcp(choice: 'ip1'|'ip2'): string {
  return choice === 'ip1' ? '203.0.113.2' : '203.0.113.3';
}

// Apply NAT translation to packet
export function applyNat(packet: { src: string; dst: string; proto: string }, rules: any[], ifaces: { dmz: string; lan: string; wan: string }): { src: string; dst: string; proto: string } {
  // Simplified NAT application - matches first applicable rule
  for (const r of rules || []) {
    if (!r.enabled) continue;
    if (!cidrMatch(packet.src, r.source)) continue;
    if (!(r.destination === 'any' || cidrMatch(packet.dst, r.destination))) continue;
    
    // Translation modes
    if (r.translation === 'masquerade') {
      const egressIp =
        r.interface === 'WAN' ? ifaces.wan :
        r.interface === 'LAN' ? ifaces.lan :
        ifaces.dmz;
      return { ...packet, src: egressIp };
    } else if (r.translation === 'snat' && r.natAddress) {
      return { ...packet, src: r.natAddress };
    } else {
      // 'none' => no change
      return packet;
    }
  }
  return packet;
}

