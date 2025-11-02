export type DeviceId = 'dmz1'|'dmz2'|'lan1'|'lan2'|'lan_rtr'|'fw'|'wan_gw'|'internet';

export type IfCfg = { ip?: string, mask?: string, gw?: string, dhcp?: boolean };

export type Topology = {
  dmz1: IfCfg, dmz2: IfCfg, lan1: IfCfg, lan2: IfCfg,
  lan_rtr: { ip1?: string, ip2?: string, mask?: string, gw?: string },
  fw: { dmz?: string, lan?: string, wan?: string, natMasq?: boolean, defaultGw?: string },
  wan: { ip1?: string, ip2?: string, gw?: string, dhcp?: 'none'|'ip1'|'ip2' }
};

