// lib/net.ts

export const isValidIp = (s: string) =>
  /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(s);

export const ipToInt = (ip: string) =>
  ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;

export const isValidMask = (s: string) => {
  if (!isValidIp(s)) return false;
  const n = ipToInt(s);
  if (n === 0 || n === 0xFFFFFFFF) return false; // Can't be all 0s or all 1s
  // mask must be contiguous 1s then 0s
  // For valid mask: invert, add 1, result should be a power of 2 (only one bit set)
  const inverted = (~n) >>> 0;
  const plusOne = (inverted + 1) >>> 0;
  // Check if plusOne is a power of 2: (x & (x - 1)) === 0
  return plusOne !== 0 && (plusOne & (plusOne - 1)) === 0;
};

export const isPrivate = (ip: string) => {
  if (!isValidIp(ip)) return false;
  const n = ipToInt(ip);
  const inRange = (a: number, b: number) => n >= a && n <= b;
  return (
    inRange(ipToInt("10.0.0.0"), ipToInt("10.255.255.255")) ||
    inRange(ipToInt("172.16.0.0"), ipToInt("172.31.255.255")) ||
    inRange(ipToInt("192.168.0.0"), ipToInt("192.168.255.255"))
  );
};

export const sameSubnet = (a: string, b: string, mask: string) => {
  const m = ipToInt(mask);
  return (ipToInt(a) & m) === (ipToInt(b) & m);
};

export const gwInSubnet = (ip: string, mask: string, gw?: string) =>
  !!gw && isValidIp(gw) && sameSubnet(ip, gw, mask);

export const emptyToUndef = (s?: string) =>
  s && s.trim() !== "" ? s.trim() : undefined;

export const isTestNetOrPublic = (ip: string) => {
  if (!isValidIp(ip)) return false;
  const n = ipToInt(ip);
  // TEST-NET-1 192.0.2.0/24, TEST-NET-2 198.51.100.0/24, TEST-NET-3 203.0.113.0/24
  const inRange = (base: string) => (ipToInt(base) >>> 8) === (n >>> 8);
  return inRange('203.0.113.0') || inRange('198.51.100.0') || inRange('192.0.2.0') || (!isPrivate(ip));
};

