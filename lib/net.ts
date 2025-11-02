export const ipToInt = (ip: string) => ip.split('.').reduce((a,b)=> (a<<8) + (+b), 0) >>> 0;

export const maskToInt = (m: string) => ipToInt(m);

export const validOctet = (v: string) => /^\d+$/.test(v) && +v >= 0 && +v <= 255;

export const isValidIp = (s?: string) => !!s && /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split('.').every(validOctet);

export const sameSubnet = (ip1: string, mask: string, ip2: string) =>
  (ipToInt(ip1) & maskToInt(mask)) === (ipToInt(ip2) & maskToInt(mask));

export const isPrivate = (ip: string) => {
  const n = ipToInt(ip);
  return (n>>>24)===10 || (n>>>20)===0xAC1 || (n>>>16)===0xC0A8;
};

export const isTestNetOrPublic = (ip: string) => {
  if (!isValidIp(ip)) return false;
  const n = ipToInt(ip);
  // TEST-NET-1 192.0.2.0/24, TEST-NET-2 198.51.100.0/24, TEST-NET-3 203.0.113.0/24
  const inRange = (base: string)=> (ipToInt(base)>>>8) === (n>>>8);
  return inRange('203.0.113.0') || inRange('198.51.100.0') || inRange('192.0.2.0') || (!isPrivate(ip));
};

