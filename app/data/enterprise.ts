import type { Scenario } from "@/lib/sim/types";

const scenarioData: Scenario = {
  name: "Enterprise Connectivity: DMZ-LAN-WAN",
  description: "Configure static IPs, gateways, firewall rules and NAT so the LAN browser can reach the mock Internet.",
  subnets: {
    dmz:  { cidr: "10.10.10.0/24",  gw: "10.10.10.1" },
    lan:  { cidr: "192.168.1.0/24", gw: "192.168.1.1" },
    wan:  { cidr: "203.0.113.0/24", gw: "203.0.113.1" }
  },
  devices: {
    router: { id: "rtr1", wan: "203.0.113.1" },
    firewall: {
      id: "fw1",
      ifaces: { dmz: "10.10.10.1", lan: "192.168.1.1", wan: "203.0.113.2" },
      nat: {},
      rules: []
    },
    lanRouter: {
      id: "lan-r1",
      lanIp: "192.168.1.254",
      gw: "192.168.1.1"
    },
    dmzHosts: [
      { id: "dmz1", nic: "ens0", ip: "10.10.10.10", mask: "255.255.255.0", gw: "10.10.10.1" },
      { id: "dmz2", nic: "ens1", ip: "10.10.10.11", mask: "255.255.255.0", gw: "10.10.10.1" }
    ],
    lanHosts: [
      { id: "lan1", nic: "ens0", ip: "192.168.1.10", mask: "255.255.255.0", gw: "192.168.1.254", role: "browser" },
      { id: "lan2", nic: "ens1", ip: "192.168.1.11", mask: "255.255.255.0", gw: "192.168.1.254" }
    ]
  },
  internet: {
    pingTarget: "8.8.8.8",
    httpHost: "mock-internet.example",
    dns: { "mock-internet.example": "198.51.100.50", "google.com": "142.250.72.14" }
  }
};

export default scenarioData;