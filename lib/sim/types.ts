export type DeviceId = string;
export type Host = {
  id: DeviceId;
  nic: string;
  ip: string;
  mask: string;
  gw: string;               // explicit gateway (can be empty)
  dns?: string;
  role?: "browser";
  committed?: boolean;
};
export type LanRouter = {
  id: DeviceId;
  lanIp: string;       // interface toward LAN
  wanIp?: string;      // not used; uplink is toward firewall LAN
  gw: string;          // default route (should be firewall LAN IP)
  dhcpOn?: 'ip1'|'ip2'|null;
};
export type WanRouter = {
  id: DeviceId;
  ip1: string;
  ip2: string;
  gw?: string;
  dhcpOn?: 'ip1'|'ip2'|null;
};
export type FirewallRule = {
  action: "ALLOW" | "DENY";
  proto: "ICMP" | "DNS" | "HTTP" | "ANY";
  src: string; // CIDR or ANY
  dst: string; // CIDR or ANY
  inIface?: "dmz" | "lan" | "wan";
};
export type NatTranslation = 'masquerade' | 'snat' | 'none';

export type NatConfig = {
  translation?: NatTranslation; // masquerade = dynamic SNAT to egress iface IP
  snat?: { srcCidr: string; toIp: string; outIface: "wan" | "lan" | "dmz" }
};
export type Interfaces = {
  dmz: string;
  lan: string;
  wan: string;
  gw_dmz?: string;
  gw_lan?: string;
  gw_wan?: string; // selected gateway per segment (optional)
};

export type Firewall = {
  id: DeviceId;
  ifaces: Interfaces;
  nat?: NatConfig;
  rules?: FirewallRule[];
};
export type Router = { id: DeviceId; wan: string };
export type Scenario = {
  name: string; description: string;
  subnets: { dmz: { cidr: string; gw: string }; lan: { cidr: string; gw: string }; wan: { cidr: string; gw: string } };
  devices: { router: Router; firewall: Firewall; lanRouter: LanRouter; dmzHosts: Host[]; lanHosts: Host[]; };
  internet: { pingTarget: string; httpHost: string; dns: Record<string, string>; };
};