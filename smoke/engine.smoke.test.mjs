import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pingFromHost } from "../lib/sim/engine.cjs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scn = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/scenarios/enterprise.json"), "utf8"));
const fw = {
  id: "fw1",
  ifaces: { dmz: "10.10.10.1", lan: "192.168.1.1", wan: "203.0.113.2" },
  nat: { snat: { srcCidr: scn.subnets.lan.cidr, toIp: "203.0.113.2" } },
  rules: [
    { action:"ALLOW", proto:"ICMP", src:"192.168.1.0/24", dst:"ANY", inIface:"lan" },
    { action:"ALLOW", proto:"ICMP", src:"ANY", dst: scn.subnets.wan.gw, inIface:"wan" }
  ]
};
const lan1 = { id:"lan1", nic:"ens0", ip:"192.168.1.10", mask:"255.255.255.0", gw:"192.168.1.1" };
const r = pingFromHost(scn, lan1, scn.internet.pingTarget, fw);
if (!r.success) { console.error("Smoke FAIL:", r); process.exit(1); }
console.log("Smoke PASS:", r.hops.join(" -> "));