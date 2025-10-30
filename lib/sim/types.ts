export type DeviceId = string;
export type Host = { id: DeviceId; nic: string; ip: string; mask: string; gw: string; dns?: string; role?: "browser"; };
export type Firewall = {
  id: DeviceId;
  ifaces: { dmz: string; lan: string; wan: string };
  nat: { snat?: { srcCidr: string; toIp: string }; dnat?: Array<{ pubPort: number; toIp: string; toPort: number }>; };
  rules: Array<{ action: "ALLOW" | "DENY"; proto: "ICMP" | "DNS" | "HTTP" | "ANY"; src: string; dst: string; port?: number; inIface?: "dmz"|"lan"|"wan"; }>;
};
export type Router = { id: DeviceId; wan: string };
export type Scenario = {
  name: string; description: string;
  subnets: { dmz: { cidr: string; gw: string }; lan: { cidr: string; gw: string }; wan: { cidr: string; gw: string } };
  devices: { router: Router; firewall: Firewall; dmzHosts: Host[]; lanHosts: Host[]; };
  internet: { pingTarget: string; httpHost: string; dns: Record<string, string>; };
};