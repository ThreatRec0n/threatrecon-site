export type IPv4 = string;
export function ipToNum(ip: IPv4): number { return ip.split('.').reduce((n, o) => (n << 8) + Number(o), 0) >>> 0; }
export function numToIp(n: number): IPv4 { return [24,16,8,0].map(s => (n >>> s) & 255).join('.'); }
export function maskToNum(mask: IPv4): number { return ipToNum(mask); }
export function parseCidr(cidr: string): {net:number, mask:number} {
  const [ip, bitsStr] = cidr.split('/'); const bits = Number(bitsStr);
  const mask = bits === 0 ? 0 : 0xFFFFFFFF << (32 - bits) >>> 0;
  return { net: ipToNum(ip) & mask, mask };
}
export function inSameSubnet(ip: IPv4, gw: IPv4, mask: IPv4): boolean {
  const m = maskToNum(mask); return (ipToNum(ip) & m) === (ipToNum(gw) & m);
}
export function subnetContains(cidr: string, ip: IPv4): boolean {
  const {net, mask} = parseCidr(cidr); return (ipToNum(ip) & mask) === net;
}