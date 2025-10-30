# Network Connectivity Simulator (MVP)
Goal: configure static IPv4, gateways, firewall rules and SNAT on a 3-zone enterprise (DMZ/LAN/WAN) so the LAN browser reaches the mock Internet.
- IPv4 only
- Static addressing
- NAT required for Internet egress
- Ping / Traceroute / NSLookup diagnostics
- Visual feedback and logs
- Entirely in-browser. No real Internet routing.

## Run
npm install
npm run dev

## Smoke Test (engine)
npm test