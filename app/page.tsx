"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import scenarioData from "@/app/data/enterprise";
import type { Scenario, Host, Firewall } from "@/lib/sim/types";
import { pingFromHost, tracerouteFromHost, nslookupHost, hopsToNodes } from "@/lib/sim/engine";
import TopologyCanvas from "@/components/TopologyCanvas";
import MissionTimer from "@/components/MissionTimer";
import HintPanel from "@/components/HintPanel";
import NetTerminal from "@/components/NetTerminal";
import NatFirewallPanel from "@/components/NatFirewallPanel";
import CircuitBackground from "@/components/CircuitBackground";
import EscapeStory from "@/components/EscapeStory";
import OxygenMeter from "@/components/OxygenMeter";
import IPRangeGuide from "@/components/IPRangeGuide";
import NetworkInfo from "@/components/NetworkInfo";
import CommitBar from "@/components/ui/CommitBar";
import ChecklistPanel from "@/components/ChecklistPanel";
import LintPanel from "@/components/LintPanel";
import RuleTraceModal from "@/components/RuleTraceModal";
import HelpOverlay from "@/components/HelpOverlay";
import ThemeToggle from "@/components/ThemeToggle";
import ObjectivesPanel from "@/components/ObjectivesPanel";
import StateTable from "@/components/StateTable";
import RoutingTable from "@/components/RoutingTable";
import PacketInspector from "@/components/PacketInspector";
import NatTable from "@/components/NatTable";
import ErrorCounter from "@/components/ErrorCounter";
import RandomEvent from "@/components/RandomEvent";
import AchievementBadge from "@/components/AchievementBadge";
import DifficultySelect from "@/components/DifficultySelect";
import SubnetCalculator from "@/components/SubnetCalculator";
import StreakCounter from "@/components/StreakCounter";
import CommonMistakes from "@/components/CommonMistakes";
import ErrorTimeline from "@/components/ErrorTimeline";
import PostGameReport from "@/components/PostGameReport";
import PracticeModeToggle from "@/components/PracticeModeToggle";
import PacketFlowAnim from "@/components/PacketFlowAnim";
import ProgressRing from "@/components/ProgressRing";
import ChallengeScenario from "@/components/ChallengeScenario";
import WanRouterModal from "@/components/modals/WanRouterModal";
import LanRouterModal from "@/components/modals/LanRouterModal";
import EnhancedPacketInspector from "@/components/EnhancedPacketInspector";
import type { ExecFn } from "@/components/terminal/DeviceTerminal";
import { simulatePing, routeExists, linkState, canPing, type Topology, type DeviceId, type Host as SimHost, type PathCheck } from "@/lib/sim";
import { isPrivate, sameSubnet, gwInSubnet, emptyToUndef, isValidIp, isValidMask } from "@/lib/net";
import LockoutOverlay from "@/components/LockoutOverlay";
import ScreenEffects from "@/components/ScreenEffects";
import ConceptMastery from "@/components/ConceptMastery";
import LearningPath from "@/components/LearningPath";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import AchievementGallery from "@/components/AchievementGallery";
import CollapsibleSection from "@/components/CollapsibleSection";
import DeviceEditModal, { type DeviceType } from "@/components/DeviceEditModal";

type Tab = "Configure" | "Firewall & NAT";

export default function Page() {
  const scn = scenarioData as Scenario;
  const [activeTab, setActiveTab] = useState<Tab>("Configure");
  
  // Initialize with empty IPs - users must configure everything
  const [fw, setFw] = useState<Firewall>({
    id: "fw1",
    ifaces: { dmz: "", lan: "", wan: "", gw_dmz: "", gw_lan: "", gw_wan: "" },
    nat: { translation: undefined },
    rules: []
  });
  const [lan1, setLan1] = useState<Host>({
    id: "lan1",
    nic: "ens0",
    ip: "",
    mask: "",
    gw: "",
    role: "browser"
  });
  const [lan2, setLan2] = useState<Host>({
    id: "lan2",
    nic: "ens1",
    ip: "",
    mask: "",
    gw: ""
  });
  const [dmz1, setDmz1] = useState<Host>({
    id: "dmz1",
    nic: "ens0",
    ip: "",
    mask: "",
    gw: ""
  });
  const [dmz2, setDmz2] = useState<Host>({
    id: "dmz2",
    nic: "ens1",
    ip: "",
    mask: "",
    gw: ""
  });
  const [lanR, setLanR] = useState({
    id: "lan-r1",
    lanIp: "",
    ip2: "",
    gw: "",
    mask: "255.255.255.0"
  });
  // WAN Router state
  const [wanModalOpen, setWanModalOpen] = useState(false);
  const [lanModalOpen, setLanModalOpen] = useState(false);
  const [wan, setWan] = useState<{ ip1: string; ip2: string; gw: string; dhcp: "none"|"ip1"|"ip2" }>({ ip1:"", ip2:"", gw:"", dhcp:"none" });
  
  
  // COMMITTED state (diagram and simulation consume these)
  const [cLan1, setCLan1] = useState<Host>({ id:"lan1", nic:"ens0", ip:"", mask:"", gw:"", role:"browser" });
  const [cLan2, setCLan2] = useState<Host>({ id:"lan2", nic:"ens1", ip:"", mask:"", gw:"" });
  const [cDmz1, setCDmz1] = useState<Host>({ id:"dmz1", nic:"ens0", ip:"", mask:"", gw:"" });
  const [cDmz2, setCDmz2] = useState<Host>({ id:"dmz2", nic:"ens1", ip:"", mask:"", gw:"" });
  const [cLanR, setCLanR] = useState({ id:"lan-r1", lanIp:"", ip2:"", gw:"", mask: "255.255.255.0" });
  const [cFw, setCFw] = useState<Firewall>({ id:"fw1", ifaces:{ dmz:"", lan:"", wan:"", gw_dmz:"", gw_lan:"", gw_wan:"" }, nat:{ translation: undefined }, rules:[] });
  
  // Build topology for new simulator
  const buildTopology = useMemo((): Topology => ({
    dmz1: { ip: cDmz1.ip, mask: cDmz1.mask || "255.255.255.0", gw: cDmz1.gw, committed: !!cDmz1.ip },
    dmz2: { ip: cDmz2.ip, mask: cDmz2.mask || "255.255.255.0", gw: cDmz2.gw, committed: !!cDmz2.ip },
    lan1: { ip: cLan1.ip, mask: cLan1.mask || "255.255.255.0", gw: cLan1.gw, committed: !!cLan1.ip },
    lan2: { ip: cLan2.ip, mask: cLan2.mask || "255.255.255.0", gw: cLan2.gw, committed: !!cLan2.ip },
    lan_rtr: { ip1: cLanR.lanIp, ip2: cLanR.ip2 || "", mask: cLanR.mask || "255.255.255.0", gw: cLanR.gw, committed: !!cLanR.lanIp },
    fw: { dmz: cFw.ifaces.dmz, lan: cFw.ifaces.lan, wan: cFw.ifaces.wan, natMasq: cFw.nat?.translation === 'masquerade', defaultGw: cFw.ifaces.gw_wan, committed: !!(cFw.ifaces.lan && cFw.ifaces.wan) },
    wan: { ip1: wan.dhcp === "ip1" ? "172.31.0.1" : wan.ip1, ip2: wan.dhcp === "ip2" ? "203.0.113.3" : wan.ip2, gw: wan.gw, dhcp: wan.dhcp, committed: !!(wan.ip1 || wan.ip2 || wan.dhcp !== "none") }
  }), [cDmz1, cDmz2, cLan1, cLan2, cLanR, cFw, wan]);

  // Exec function for terminals - map source IDs
  const exec: ExecFn = async (src, cmd, args) => {
    if (cmd === "help") return ["commands:", "  ping <ip|host>", "  traceroute <ip|host>", "  clear"];
    if (cmd === "clear") return [];
    if (cmd !== "ping" && cmd !== "traceroute") return ["unknown command"];
    
    const t = buildTopology;
    // Map source kind/id to DeviceId
    let deviceId: DeviceId;
    if (src.id === "DMZ1" || (src.kind === "dmz" && src.id.toLowerCase() === "dmz1")) deviceId = "dmz1";
    else if (src.id === "DMZ2" || (src.kind === "dmz" && src.id.toLowerCase() === "dmz2")) deviceId = "dmz2";
    else if (src.id === "LAN1" || (src.kind === "lan" && src.id.toLowerCase() === "lan1")) deviceId = "lan1";
    else if (src.id === "LAN2" || (src.kind === "lan" && src.id.toLowerCase() === "lan2")) deviceId = "lan2";
    else if (src.id === "lan_rtr" || src.id === "LAN_RTR" || (src.kind === "lan" && src.id.includes("rtr"))) deviceId = "lan_rtr";
    else if (src.id === "firewall" || src.id === "FW" || src.kind === "fw") deviceId = "fw";
    else if (src.id === "wan_rtr" || src.id === "WAN_ROUTER" || (src.kind === "wan" && src.id.includes("wan"))) deviceId = "wan_gw";
    else return ["error: unknown source device"];
    
    // Resolve destination - could be IP or device name
    let dst = args[0] || "8.8.8.8";
    if (!isValidIp(dst)) {
      // Try to resolve device names to IPs
      if (dst.toUpperCase() === "DMZ1" || dst.toLowerCase() === "dmz1") dst = cDmz1.ip || "";
      else if (dst.toUpperCase() === "DMZ2" || dst.toLowerCase() === "dmz2") dst = cDmz2.ip || "";
      else if (dst.toUpperCase() === "LAN1" || dst.toLowerCase() === "lan1") dst = cLan1.ip || "";
      else if (dst.toUpperCase() === "LAN2" || dst.toLowerCase() === "lan2") dst = cLan2.ip || "";
      else if (dst.toUpperCase() === "LAN_RTR" || dst.toLowerCase() === "lan_rtr") dst = cLanR.lanIp || "";
    }
    
    if (!dst || !isValidIp(dst)) {
      return [`error: invalid destination "${args[0] || '8.8.8.8'}"`];
    }
    
    if (cmd === "ping") {
      return simulatePing(t, deviceId, dst);
    } else {
      // traceroute: show hops based on route
      const route = routeExists(t, deviceId, dst);
      const lines = [`traceroute to ${dst} (${dst}), 30 hops max`];
      if (route.ok) {
        lines.push(`1  ${deviceId}`);
        if (deviceId === "lan1" || deviceId === "lan2") lines.push(`2  lan_rtr`);
        if (deviceId === "lan1" || deviceId === "lan2" || deviceId === "lan_rtr") lines.push(`3  fw`);
        if (route.ok) lines.push(`4  wan_gw`);
        if (!isPrivate(dst)) lines.push(`5  internet`);
      } else {
        lines.push(`* * *  (blocked: ${route.reason})`);
      }
      return lines;
    }
  };

  const isValidIp = (ip?: string) => {
    if (!ip) return false;
    const parts = ip.split(".");
    return parts.length === 4 && parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && p === String(n);
    });
  };

  const commitLan1 = () => commitWithValidation("LAN1", () => setCLan1({ ...lan1 }), () => isValidIp(lan1.ip) && isValidIp(lan1.gw));
  const commitLan2 = () => commitWithValidation("LAN2", () => setCLan2({ ...lan2 }), () => !lan2.ip || (isValidIp(lan2.ip) && isValidIp(lan2.gw)));
  const commitDmz1 = () => commitWithValidation("DMZ1", () => setCDmz1({ ...dmz1 }), () => isValidIp(dmz1.ip) && isValidIp(dmz1.gw));
  const commitDmz2 = () => commitWithValidation("DMZ2", () => setCDmz2({ ...dmz2 }), () => !dmz2.ip || (isValidIp(dmz2.ip) && isValidIp(dmz2.gw)));
  const commitLanRouter = () => commitWithValidation("LAN_ROUTER", () => setCLanR({ ...lanR, ip2: lanR.ip2 || "" }), () => isValidIp(lanR.lanIp) && lanR.lanIp.startsWith("192.168.") && isValidIp(lanR.gw));
  const commitFirewall = () => commitWithValidation("FW", () => setCFw({ ...fw }), () => isValidIp(fw.ifaces.lan) && isValidIp(fw.ifaces.wan) && fw.ifaces.dmz?.startsWith("10."));
  const [logs, setLogs] = useState<string[]>([]);
  const [output, setOutput] = useState<string>("");
  const [packetPath, setPacketPath] = useState<Array<any>>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const [natOverlay, setNatOverlay] = useState<{from: string; to: string; visible: boolean}>({from: "", to: "", visible: false});
  const [preset, setPreset] = useState<"Beginner"|"Intermediate"|"Advanced" | null>(null); // Start with null - show selector
  const [oxygenLevel, setOxygenLevel] = useState(100);
  const [isConnected, setIsConnected] = useState(false);
  const [hasEscaped, setHasEscaped] = useState(false);
  const [trace, setTrace] = useState<{ command: string; args: string[]; hops: string[]; success: boolean; reason?: string }|null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [errorHistory, setErrorHistory] = useState<Array<{time: number; msg: string; type: string}>>([]);
  const [streak, setStreak] = useState(0);
  const [practiceMode, setPracticeMode] = useState(false);
  const [commits, setCommits] = useState(0);
  const [pings, setPings] = useState(0);
  const [startTime] = useState(Date.now());
  const [showReport, setShowReport] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string | undefined>();
  const [completionProgress, setCompletionProgress] = useState(0);
  const [lockout, setLockout] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [screenFlash, setScreenFlash] = useState<"error" | "success" | undefined>();
  const [conceptProgress, setConceptProgress] = useState<Record<string, number>>({
    subnetting: 0,
    routing: 0,
    nat: 0,
    firewall: 0,
  });
  const [achievements, setAchievements] = useState<Record<string, boolean>>({
    firstCommit: false,
    firstPing: false,
    zeroErrors: false,
    speedRun: false,
    streakMaster: false,
    perfectionist: false,
  });
  const [editingDevice, setEditingDevice] = useState<{type: "firewall"|"lan-router"|"wan-router"|"lan-host"|"dmz-host"; nodeId: string} | null>(null);

  const addLog = (s: string) => setLogs(l => [s, ...l].slice(0, 200));

  // Sync oxygen level with timer (controlled by MissionTimer) + error penalty
  const handleTimeUpdate = (remainingPercent: number) => {
    if (!hasEscaped && !isConnected && !practiceMode) {
      const penalty = errorCount > 0 ? Math.min(errorCount * 2, 15) : 0; // Max 15% penalty
      const adjusted = Math.max(0, remainingPercent - penalty);
      setOxygenLevel(adjusted);
    } else if (practiceMode) {
      setOxygenLevel(100); // Keep at 100% in practice mode
    }
  };

  // Track achievements and progress
  useEffect(() => {
    if (cLan1.ip && !achievements.firstCommit) {
      setAchievements(a => ({ ...a, firstCommit: true }));
    }
    if (trace?.success && !achievements.firstPing) {
      setAchievements(a => ({ ...a, firstPing: true }));
    }
    if (errorCount === 0 && (cLan1.ip || cLanR.lanIp || cFw.ifaces.lan) && !achievements.zeroErrors) {
      setAchievements(a => ({ ...a, zeroErrors: true }));
    }
    if (isConnected && oxygenLevel > 80 && !achievements.speedRun) {
      setAchievements(a => ({ ...a, speedRun: true }));
    }
    if (streak >= 10 && !achievements.streakMaster) {
      setAchievements(a => ({ ...a, streakMaster: true }));
    }
    if (conceptProgress.subnetting === 100 && conceptProgress.routing === 100 && conceptProgress.nat === 100 && conceptProgress.firewall === 100 && !achievements.perfectionist) {
      setAchievements(a => ({ ...a, perfectionist: true }));
    }
    
    // Calculate completion progress
    let progress = 0;
    if (cLan1.ip) progress += 15;
    if (cLanR.lanIp) progress += 15;
    if (cFw.ifaces.lan) progress += 15;
    if (cFw.ifaces.wan) progress += 15;
    if (cFw.rules && cFw.rules.length > 0) progress += 20;
    if (cFw.nat?.snat) progress += 20;
    setCompletionProgress(progress);

    // Update concept mastery
    const concepts: Record<string, number> = {
      subnetting: (cLan1.ip && inSame24(cLan1.ip, cLanR.lanIp) ? 100 : (cLan1.ip ? 50 : 0)),
      routing: (cLanR.gw === cFw.ifaces.lan ? 100 : (cLanR.gw ? 50 : 0)),
      nat: (cFw.nat?.snat && cFw.nat.snat.srcCidr.endsWith('/24') ? 100 : (cFw.nat?.snat ? 50 : 0)),
      firewall: (cFw.rules && cFw.rules.length >= 2 ? 100 : (cFw.rules && cFw.rules.length > 0 ? 50 : 0)),
    };
    setConceptProgress(concepts);
  }, [cLan1.ip, trace, errorCount, isConnected, oxygenLevel, achievements, cLanR.lanIp, cFw, cLanR.gw]);

  // Penalize on invalid commit attempts
  const commitWithValidation = (key: string, commitFn: ()=>void, validator: ()=>boolean) => {
    if (!validator()) {
      if (!practiceMode) {
        const newCount = errorCount + 1;
        setErrorCount(newCount);
        setStreak(0);
        setErrorHistory(h => [...h, { time: Date.now(), msg: `Invalid commit: ${key}`, type: key }]);
        setScreenShake(true);
        setScreenFlash("error");
        setTimeout(() => { setScreenShake(false); setScreenFlash(undefined); }, 300);
        
        // Lockout after 3 consecutive errors
        if (newCount >= 3 && newCount % 3 === 0) {
          setLockout(true);
        }
      }
      addLog(`❌ Invalid commit attempt on ${key}${practiceMode ? " (practice mode - no penalty)" : " - penalty applied"}`);
      return;
    }
    commitFn();
    setCommits(c => c + 1);
    setStreak(s => s + 1);
    setScreenFlash("success");
    setTimeout(() => setScreenFlash(undefined), 300);
    if (errorCount > 0 && validator() && !practiceMode) {
      // Small reward for correct commit after errors
      setErrorCount(c => Math.max(0, c - 0.5));
    }
  };

  // Check for successful connection (uses COMMITTED config) - Enhanced validation
  useEffect(() => {
    const checkConnection = () => {
      // Strict validation: all must be configured AND valid
      if (!cLan1.ip || !cFw.ifaces.lan || !cFw.ifaces.wan || !cLanR.lanIp) return;
      if (!isValidIp(cLan1.ip) || !isValidIp(cFw.ifaces.lan) || !isValidIp(cFw.ifaces.wan) || !isValidIp(cLanR.lanIp)) return;
      // Verify subnet correctness before checking
      const same24 = cLan1.ip.split('.').slice(0,3).join('.') === cLanR.lanIp.split('.').slice(0,3).join('.');
      if (!same24 || cLan1.gw !== cLanR.lanIp) return;
      if (cLanR.gw !== cFw.ifaces.lan) return;
      
      const res = pingFromHost(scn, cLan1, scn.internet.pingTarget, cFw, cLanR);
      if (res.success && !isConnected) {
        setIsConnected(true);
        addLog("✅ Connection established! Door unlocking...");
      }
    };

    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [scn, cLan1, cFw, cLanR, isConnected, addLog]);

  // Keyboard: Ctrl+Enter commit all if valid
  useEffect(()=>{
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        commitLan1(); commitLan2(); commitDmz1(); commitDmz2(); commitLanRouter(); commitFirewall();
      }
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  },[]);

  function inSame24(a:string,b:string){const A=a.split(".").map(n=>+n),B=b.split(".").map(n=>+n);return A[0]===B[0]&&A[1]===B[1]&&A[2]===B[2];}

  // Calculate device status - check if configured and valid
  const getNodeStatus = (nodeId: string, ip?: string, gw?: string): "ok"|"warning"|"error"|undefined => {
    if (nodeId === "LAN1") {
      if (!cLan1.ip || !cLanR.lanIp) return "error"; // Not configured
      if (inSame24(cLan1.ip, cLanR.lanIp) && cLan1.gw === cLanR.lanIp) return "ok";
      return "warning"; // Configured but incorrect
    }
    if (nodeId === "LAN2") {
      if (!cLan2.ip || !cLanR.lanIp) return undefined; // Optional device
      if (inSame24(cLan2.ip, cLanR.lanIp) && cLan2.gw === cLanR.lanIp) return "ok";
      return "warning";
    }
    if (nodeId === "LAN_ROUTER") {
      if (!cLanR.lanIp || !cFw.ifaces.lan) return "error";
      if (cLanR.gw === cFw.ifaces.lan) return "ok";
      return "warning";
    }
    if (nodeId === "FW") {
      if (!cFw.ifaces.lan || !cFw.ifaces.wan) return "error";
      const hasRules = cFw.rules && cFw.rules.length > 0;
      const hasSnat = !!cFw.nat?.snat && cFw.nat.snat.outIface === "wan";
      if (hasRules && hasSnat) return "ok";
      if (!hasRules || !hasSnat) return "warning";
    }
    return undefined;
  };

  // Build topology nodes/links for the diagram
  const topo = useMemo(()=>{
    const t = buildTopology;
    const ls = linkState(t);
    
    // Create Host objects for canPing checks
    const dmz1Host: SimHost = { ip: cDmz1.ip || "", mask: cDmz1.mask || "255.255.255.0", gw: cDmz1.gw, committed: !!cDmz1.ip };
    const dmz2Host: SimHost = { ip: cDmz2.ip || "", mask: cDmz2.mask || "255.255.255.0", gw: cDmz2.gw, committed: !!cDmz2.ip };
    const lan1Host: SimHost = { ip: cLan1.ip || "", mask: cLan1.mask || "255.255.255.0", gw: cLan1.gw, committed: !!cLan1.ip };
    const lan2Host: SimHost = { ip: cLan2.ip || "", mask: cLan2.mask || "255.255.255.0", gw: cLan2.gw, committed: !!cLan2.ip };
    const internetHost: SimHost = { ip: "8.8.8.8", mask: "255.255.255.255", committed: true };
    
    // Check peer links
    const dmzPeer = canPing(dmz1Host, dmz2Host, t);
    const lanPeer = canPing(lan1Host, lan2Host, t);
    const internetPath = canPing(lan1Host, internetHost, t);
    
    // Check firewall to WAN router connection (subnet match)
    const wanIp = wan.dhcp === "ip1" ? "172.31.0.1" : (wan.dhcp === "ip2" ? "203.0.113.3" : (wan.ip1 || wan.ip2 || ""));
    const fwToWanOk = isValidIp(cFw.ifaces.wan || "") && isValidIp(wanIp) && sameSubnet(cFw.ifaces.wan || "", wanIp, "255.255.255.0");
    
    return {
      nodes: [
        { id:"DMZ1", x:160, y:300, label:"DMZ1", ip:cDmz1.ip || undefined, zone:"dmz", status: getNodeStatus("DMZ1"), kind:"laptop" as const },
        { id:"DMZ2", x:160, y:420, label:"DMZ2", ip:cDmz2.ip || undefined, zone:"dmz", status: getNodeStatus("DMZ2"), kind:"laptop" as const },
        { id:"FW", x:460, y:360, label:"FIREWALL", ip:cFw.ifaces.wan || undefined, zone:"wan", status: getNodeStatus("FW"), kind:"firewall" as const },
        { id:"WAN_ROUTER", x:460, y:160, label:"WAN GW", ip:wanIp || undefined, zone:"wan", kind:"router" as const },
        { id:"LAN_ROUTER", x:720, y:240, label:"LAN RTR", ip:cLanR.lanIp || undefined, zone:"lan", status: getNodeStatus("LAN_ROUTER"), kind:"router" as const },
        { id:"LAN1", x:650, y:360, label:"LAN1", ip:cLan1.ip || undefined, zone:"lan", status: getNodeStatus("LAN1"), kind:"laptop" as const },
        { id:"LAN2", x:790, y:360, label:"LAN2", ip:cLan2.ip || undefined, zone:"lan", status: getNodeStatus("LAN2"), kind:"laptop" as const },
        { id:"INTERNET", x:460, y:80, label:"INTERNET", ip:undefined, zone:"internet", status: "ok" as const, kind:"cloud" as const }
      ],
      links: [
        // DMZ peers - show connection if on same network (dotted if not pingable, solid if pingable)
        { 
          from:"DMZ1", 
          to:"DMZ2", 
          ok:dmzPeer.ok || (cDmz1.ip && cDmz2.ip && sameSubnet(cDmz1.ip, cDmz2.ip, cDmz1.mask || "255.255.255.0")), 
          active:dmzPeer.ok, 
          color:dmzPeer.ok ? 'blue' : (cDmz1.ip && cDmz2.ip && sameSubnet(cDmz1.ip, cDmz2.ip, cDmz1.mask || "255.255.255.0") ? 'gray' : 'gray')
        },
        // LAN peers - show connection if on same network (dotted if not pingable, solid if pingable)
        { 
          from:"LAN1", 
          to:"LAN2", 
          ok:lanPeer.ok || (cLan1.ip && cLan2.ip && sameSubnet(cLan1.ip, cLan2.ip, cLan1.mask || "255.255.255.0")), 
          active:lanPeer.ok, 
          color:lanPeer.ok ? 'blue' : (cLan1.ip && cLan2.ip && sameSubnet(cLan1.ip, cLan2.ip, cLan1.mask || "255.255.255.0") ? 'gray' : 'gray')
        },
        // LAN hosts to router (always show when configured)
        { from:"LAN1", to:"LAN_ROUTER", ok:!!cLan1.ip && !!cLanR.lanIp && sameSubnet(cLan1.ip, cLanR.lanIp, cLan1.mask || "255.255.255.0"), active:!!cLan1.ip && !!cLanR.lanIp, color:'blue' },
        { from:"LAN2", to:"LAN_ROUTER", ok:!!cLan2.ip && !!cLanR.lanIp && sameSubnet(cLan2.ip, cLanR.lanIp, cLan2.mask || "255.255.255.0"), active:!!cLan2.ip && !!cLanR.lanIp, color:'blue' },
        // LAN router to firewall
        { from:"LAN_ROUTER", to:"FW", ok:ls.lan_to_fw, active:ls.lan_to_fw, color:ls.lan_to_fw ? 'blue' : 'gray' },
        // Firewall to WAN router (subnet match only, gateway optional for L2)
        { from:"FW", to:"WAN_ROUTER", ok:fwToWanOk, active:fwToWanOk, color:fwToWanOk ? 'blue' : 'gray' },
        // Internet link - red when path is via_internet
        { from:"WAN_ROUTER", to:"INTERNET", ok:internetPath.ok && internetPath.path === 'via_internet', active:false, color:(internetPath.ok && internetPath.path === 'via_internet') ? 'red' : 'gray' }
      ]
    };
  }, [cDmz1, cDmz2, cFw, cLan1, cLan2, cLanR, wan, buildTopology]);

  const getHints = () => {
    const hints: string[] = [
      "📋 Private IP Ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16",
      "Subnet mask: 255.255.255.0 (/24) for all private networks",
      "SNAT: 192.168.1.0/24 → Firewall WAN IP; ICMP allowed on LAN+WAN",
    ];
    if (!cLan1.ip) hints.push("LAN Host not committed yet");
    if (cLan1.ip && !cLanR.lanIp) hints.push("Commit LAN Router before LAN Host can route");
    if (cLanR.lanIp && (!cFw.ifaces.lan || cLanR.gw !== cFw.ifaces.lan)) hints.push("LAN Router gateway must equal Firewall LAN IP");
    if (!cFw.ifaces.wan) hints.push("Commit Firewall WAN interface (203.0.113.x)");
    if (!cFw.nat?.snat) hints.push("Configure SNAT for 192.168.1.0/24 → FW WAN");
    if (oxygenLevel < 50) hints.push("⚠️ Oxygen low: reduce mistakes, check subnets/gateways");
    return hints;
  };

  const handleEscape = () => {
    setHasEscaped(true);
    setIsConnected(true);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setTimeout(() => {
      setShowReport(true);
    }, 2000);
  };

  const handleOxygenDepleted = () => {
    // Game over - show message
    alert("Oxygen depleted. You didn't make it in time. The door remains locked.");
  };

  // Show difficulty selector if not selected
  if (preset === null) {
    return (
      <main className="min-h-screen relative">
        <CircuitBackground />
        <DifficultySelect onSelect={(d) => {
          setPreset(d);
          // Reset everything when starting
          setOxygenLevel(100);
          setIsConnected(false);
          setHasEscaped(false);
          setErrorCount(0);
          setAchievements({
            firstCommit: false,
            firstPing: false,
            zeroErrors: false,
            speedRun: false,
          });
        }} />
      </main>
    );
  }

  if (hasEscaped) {
    return (
      <main className="min-h-screen relative">
        <CircuitBackground />
        <div className="relative z-50 flex items-center justify-center min-h-screen">
          <div className="bg-slate-900/95 backdrop-blur border-2 border-emerald-500 rounded-xl p-12 max-w-2xl text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-8xl mb-6"
            >
              🎉
            </motion.div>
            <h1 className="text-4xl font-bold text-emerald-400 mb-4">Escape Successful!</h1>
            <p className="text-xl text-slate-300 mb-6">
              You successfully configured the network and established a connection to the outside world.
            </p>
            <p className="text-lg text-slate-400">
              The door unlocked, and you made it out alive. Well done!
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Main render
  return (
    <main className="min-h-screen relative">
      <CircuitBackground />
      <OxygenMeter level={oxygenLevel} onDepleted={handleOxygenDepleted} />
      <EscapeStory oxygenLevel={oxygenLevel} onEscape={handleEscape} isConnected={isConnected} />
      <header className="relative z-10 flex items-center justify-between p-4 border-b bg-slate-900/80 backdrop-blur-sm text-white">
        <div className="font-semibold text-white">🚪 Escape Room: Network Configuration</div>
        <div className="flex items-center gap-3">
          <ErrorCounter count={errorCount} />
          <StreakCounter streak={streak} />
          <MissionTimer minutes={practiceMode ? 999 : 30} onExpire={practiceMode ? ()=>{} : handleOxygenDepleted} onTimeUpdate={handleTimeUpdate} />
          <div className="text-sm text-slate-300">Connect to Internet to Unlock Door</div>
          <div className="flex gap-1">
            <AchievementBadge id="firstCommit" name="First Commit" earned={achievements.firstCommit} />
            <AchievementBadge id="firstPing" name="First Ping" earned={achievements.firstPing} />
            <AchievementBadge id="zeroErrors" name="Zero Errors" earned={achievements.zeroErrors} />
            <AchievementBadge id="speedRun" name="Speed Run" earned={achievements.speedRun} />
          </div>
          <ThemeToggle />
          <button onClick={()=>setHelpOpen(true)} className="px-2 py-1 rounded border text-xs">Help (H)</button>
        </div>
      </header>
      <KeyboardShortcuts visible={helpOpen} />
      {showReport && (
        <PostGameReport
          report={{
            timeSpent: Math.floor((Date.now() - startTime) / 1000),
            errors: errorCount,
            commits,
            pings,
            success: isConnected,
            achievements: Object.entries(achievements).filter(([,e])=>e).map(([k])=>k),
          }}
          onClose={() => setShowReport(false)}
        />
      )}
      <ScreenEffects shake={screenShake} flash={screenFlash} glow={isConnected} />
      <LockoutOverlay active={lockout} onComplete={() => setLockout(false)} />
      <RandomEvent enabled={!hasEscaped && !isConnected && !practiceMode} onEvent={(e) => {
        if (e.severity === "high") {
          if (!practiceMode) {
            setErrorCount(c => c + 1);
            setScreenShake(true);
            setTimeout(() => setScreenShake(false), 300);
          }
          addLog(`🚨 ${e.msg} - Error penalty applied!`);
        } else {
          addLog(`⚠️ ${e.msg}`);
        }
      }} />
      <div className="relative z-10 p-3 grid grid-cols-12 gap-3" style={{ maxHeight: 'calc(100vh - 120px)', overflow: 'hidden' }}>
        {/* Animated Topology */}
        <section className="col-span-7 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/30 p-3 flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <h2 className="font-medium mb-2 text-sm">Network Topology</h2>
          <div className="flex-1 min-h-0">
            <TopologyCanvas 
              nodes={topo.nodes as any} 
              links={topo.links as any} 
              packetPath={packetPath as any} 
              natOverlay={natOverlay}
              onNodeClick={(nodeId) => {
                if (nodeId === "FW") setEditingDevice({ type: "firewall", nodeId: "FW" });
                else if (nodeId === "LAN_ROUTER") setLanModalOpen(true);
                else if (nodeId === "WAN_ROUTER") setWanModalOpen(true);
                else if (nodeId === "LAN1") setEditingDevice({ type: "lan-host", nodeId: "LAN1" });
                else if (nodeId === "LAN2") setEditingDevice({ type: "lan-host", nodeId: "LAN2" });
                else if (nodeId === "DMZ1") setEditingDevice({ type: "dmz-host", nodeId: "DMZ1" });
                else if (nodeId === "DMZ2") setEditingDevice({ type: "dmz-host", nodeId: "DMZ2" });
              }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500 space-y-1">
            <div>
              <span className="font-semibold text-red-400">⚠️ OBJECTIVE:</span> Configure all network devices with correct static IPs, gateways, firewall rules, and NAT to establish Internet connectivity.
            </div>
            <div className="text-slate-400">
              The door unlocks when {cLan1.id} successfully reaches {scn.internet.pingTarget}.
              <span className="font-mono text-slate-600"> Use private IP ranges (10.x, 172.x, 192.x).</span>
            </div>
            {oxygenLevel < 30 && <span className="block mt-1 text-red-400 animate-pulse">⚡ CRITICAL: Oxygen running low!</span>}
          </div>
        </section>

        {/* Right panel - Compact Layout */}
        <section className="col-span-5 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/30 p-3 flex flex-col overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          <div className="flex gap-1.5 text-xs mb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10 pb-2">
            {(["Configure","Firewall & NAT"] as Tab[]).map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} className={`px-2 py-1 border rounded flex-1 ${activeTab===t?"bg-slate-900 text-white":"bg-white hover:bg-slate-50"}`}>{t}</button>
            ))}
          </div>
          
          {/* Compact Tools Bar */}
          <div className="mb-2 grid grid-cols-3 gap-1.5 text-[10px]">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border bg-slate-50">
              <span className="text-slate-600">Level:</span>
              <span className={`px-1 rounded font-semibold ${
                preset === "Beginner" ? "bg-emerald-100 text-emerald-800" :
                preset === "Intermediate" ? "bg-blue-100 text-blue-800" :
                "bg-red-100 text-red-800"
              }`}>
                {preset}
              </span>
            </div>
            <PracticeModeToggle enabled={practiceMode} onToggle={setPracticeMode} />
            <div className="flex items-center justify-center px-1.5 py-0.5 rounded border bg-slate-50">
              <ProgressRing progress={completionProgress} label="" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            <HintPanel getHints={getHints}/>
            
            <CollapsibleSection title="Tools & Help" icon="🛠️" defaultOpen={false}>
              <div className="space-y-1.5">
                <SubnetCalculator />
                <CommonMistakes />
                <ErrorTimeline errors={errorHistory} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Learning & Progress" icon="📚" defaultOpen={false}>
              <div className="space-y-1.5">
                <ChallengeScenario selected={selectedChallenge} onSelect={setSelectedChallenge} />
                <LearningPath steps={[
                  { id: "1", title: "Configure LAN Host IP and gateway", done: !!cLan1.ip && !!cLan1.gw, next: !cLan1.ip },
                  { id: "2", title: "Configure LAN Router", done: !!cLanR.lanIp && cLanR.gw === cFw.ifaces.lan, next: !!cLan1.ip && !cLanR.lanIp },
                  { id: "3", title: "Configure Firewall interfaces", done: !!cFw.ifaces.lan && !!cFw.ifaces.wan, next: !!cLanR.lanIp && !cFw.ifaces.lan },
                  { id: "4", title: "Create firewall rules", done: !!cFw.rules && cFw.rules.length >= 2, next: !!cFw.ifaces.wan && (!cFw.rules || cFw.rules.length < 2) },
                  { id: "5", title: "Configure SNAT", done: !!cFw.nat?.snat && cFw.nat.snat.srcCidr.endsWith('/24'), next: !!cFw.rules && cFw.rules.length >= 2 && !cFw.nat?.snat },
                  { id: "6", title: "Test connectivity", done: isConnected, next: !!cFw.nat?.snat && !isConnected },
                ]} />
                <ConceptMastery concepts={[
                  { id: "subnetting", name: "Subnetting", mastered: conceptProgress.subnetting === 100, progress: conceptProgress.subnetting },
                  { id: "routing", name: "Routing", mastered: conceptProgress.routing === 100, progress: conceptProgress.routing },
                  { id: "nat", name: "NAT", mastered: conceptProgress.nat === 100, progress: conceptProgress.nat },
                  { id: "firewall", name: "Firewall Rules", mastered: conceptProgress.firewall === 100, progress: conceptProgress.firewall },
                ]} />
              </div>
            </CollapsibleSection>
            
          {activeTab === "Configure" && (
            <div className="space-y-2">
              <CollapsibleSection title="IP Range Guide" icon="📋" defaultOpen={false}>
                <IPRangeGuide />
                <div className="grid grid-cols-3 gap-1.5 text-xs mt-2">
                  <NetworkInfo subnet="lan" requiredRange="192.168.x.x /24" description="LAN - Class C" />
                  <NetworkInfo subnet="dmz" requiredRange="10.x.x.x /24" description="DMZ - Class A" />
                  <NetworkInfo subnet="wan" requiredRange="203.0.113.x /24" description="WAN - Public" />
                </div>
              </CollapsibleSection>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <div className="font-semibold text-blue-900 mb-1">💡 Click devices in the topology diagram to configure</div>
                <div className="text-blue-700 space-y-0.5">
                  <div>• Firewall: Click to set DMZ, LAN, WAN interfaces</div>
                  <div>• LAN Router: Click to set LAN IP + Gateway</div>
                  <div>• WAN Router: Click to set WAN IP + Gateway</div>
                  <div>• Hosts: Click to set IP, Mask, Gateway</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "Firewall & NAT" && (
            <div className="text-sm">
              <NatFirewallPanel fw={fw} onChange={setFw}/>
            </div>
          )}
          </div>
        </section>
      </div>
      <RuleTraceModal trace={trace} onClose={()=>setTrace(null)} />
      <HelpOverlay isOpen={helpOpen} onClose={()=>setHelpOpen(false)} />
      <DeviceEditModal
        open={!!editingDevice}
        device={editingDevice?.type || null}
        nodeId={editingDevice?.nodeId}
        onExec={exec}
        data={(() => {
          if (!editingDevice) return { type: "firewall" as DeviceType, dmz: "", lan: "", wan: "" };
          if (editingDevice.type === "firewall") {
            return { type: "firewall" as DeviceType, dmz: fw.ifaces.dmz || "", lan: fw.ifaces.lan || "", wan: fw.ifaces.wan || "", gw: fw.ifaces.gw_wan || "" };
          }
          if (editingDevice.type === "lan-router") {
            return { type: "lan-router" as DeviceType, ip1: lanR.lanIp || "", ip2: lanR.ip2 || "", gw: lanR.gw || "" };
          }
          if (editingDevice.type === "wan-router") {
            // WAN Router: use current wan state
            return { type: "wan-router" as DeviceType, ip1: wan.ip1 || "", ip2: wan.ip2 || "", gw: wan.gw || "", dhcpOn: wan.dhcp === "none" ? null : wan.dhcp };
          }
          if (editingDevice.type === "lan-host") {
            const host = editingDevice.nodeId === "LAN1" ? lan1 : lan2;
            return { type: "lan-host" as DeviceType, ip1: host.ip || "", mask: host.mask || "", gw: host.gw || "" };
          }
          if (editingDevice.type === "dmz-host") {
            const host = editingDevice.nodeId === "DMZ1" ? dmz1 : dmz2;
            return { type: "dmz-host" as DeviceType, ip1: host.ip || "", mask: host.mask || "", gw: host.gw || "" };
          }
          return { type: "firewall" as DeviceType, dmz: "", lan: "", wan: "" };
        })()}
        onChange={(data) => {
          if (!editingDevice) return;
          if (editingDevice.type === "firewall") {
            setFw({ ...fw, ifaces: { dmz: data.dmz || "", lan: data.lan || "", wan: data.wan || "", gw_dmz: data.gw || "", gw_lan: "", gw_wan: data.gw || "" } });
          } else if (editingDevice.type === "lan-router") {
            setLanR({ ...lanR, lanIp: data.ip1 || "", ip2: data.ip2 || "", gw: data.gw || "" });
          } else if (editingDevice.type === "wan-router") {
            // WAN Router state - handle DHCP and preserve ip2
            setWan({ 
              ip1: data.dhcpOn === "ip1" ? "172.31.0.1" : (data.ip1 || ""), 
              ip2: data.dhcpOn === "ip2" ? "203.0.113.3" : (data.ip2 || ""), 
              gw: data.gw || "", 
              dhcp: (data.dhcpOn === null ? "none" : data.dhcpOn) as "none" | "ip1" | "ip2"
            });
          } else if (editingDevice.type === "lan-host") {
            const setter = editingDevice.nodeId === "LAN1" ? setLan1 : setLan2;
            setter({ ...(editingDevice.nodeId === "LAN1" ? lan1 : lan2), ip: data.ip1 || "", mask: data.mask || "", gw: data.gw || "" });
          } else if (editingDevice.type === "dmz-host") {
            const setter = editingDevice.nodeId === "DMZ1" ? setDmz1 : setDmz2;
            setter({ ...(editingDevice.nodeId === "DMZ1" ? dmz1 : dmz2), ip: data.ip1 || "", mask: data.mask || "", gw: data.gw || "" });
          }
        }}
        onClose={() => setEditingDevice(null)}
        onCommit={() => {
          if (!editingDevice) return;
          if (editingDevice.type === "firewall") commitFirewall();
          else if (editingDevice.type === "lan-router") commitLanRouter();
          else if (editingDevice.type === "wan-router") {
            // WAN router commit - values already in state from onChange
            // No need to commit separately, state is updated on change
          } else if (editingDevice.type === "lan-host") {
            if (editingDevice.nodeId === "LAN1") commitLan1();
            else commitLan2();
          } else if (editingDevice.type === "dmz-host") {
            if (editingDevice.nodeId === "DMZ1") commitDmz1();
            else commitDmz2();
          }
          setEditingDevice(null);
        }}
      />
      <WanRouterModal
        isOpen={wanModalOpen}
        initial={wan}
        onClose={() => setWanModalOpen(false)}
        onCommit={(v) => {
          // Keep ip2 as string in state, only coerce to undefined when writing to store if needed
          setWan({ 
            ip1: v.ip1 || "", 
            ip2: v.ip2 || "", // Keep ip2 as string, even if empty
            gw: v.gw || "", 
            dhcp: v.dhcp 
          });
          setWanModalOpen(false);
        }}
        onExec={exec}
      />
      <LanRouterModal
        isOpen={lanModalOpen}
        initial={{ ip1: lanR.lanIp, ip2: lanR.ip2 || "", gw: lanR.gw }}
        onClose={() => setLanModalOpen(false)}
        onCommit={(v) => {
          // Preserve ip2 even if empty - keep it as a string in state, never drop the key
          setLanR({ 
            ...lanR, 
            lanIp: v.ip1, 
            ip2: v.ip2 || "", // Keep ip2 as string, even if empty
            gw: v.gw, 
            mask: "255.255.255.0" 
          });
          setLanModalOpen(false);
        }}
        onExec={exec}
      />
    </main>
  );
}

function DeviceConfig({ title, host, onChange, hint, committedIp, onCommit }: { title: string; host: any; onChange: (h: any) => void; hint?: string; committedIp?: string; onCommit?: ()=>void }) {
  const isValid = (ip: string) => {
    if (!ip) return false;
    const parts = ip.split(".");
    return parts.length === 4 && parts.every(p => {
      const n = parseInt(p, 10);
      return !isNaN(n) && n >= 0 && n <= 255 && p === String(n);
    });
  };
  const isMaskValid = (mask: string) => mask === "255.255.255.0";
  const gwMatchesSubnet = (ip: string, gw: string) => !!(ip && gw && isValid(ip) && isValid(gw) && ip.split('.').slice(0,3).join('.') === gw.split('.').slice(0,3).join('.'));

  const getIpClass = (ip: string): string => {
    if (!ip) return "";
    const first = parseInt(ip.split(".")[0] || "0", 10);
    if (first >= 1 && first <= 126) return "Class A (10.x.x.x)";
    if (first >= 128 && first <= 191) return "Class B (172.x.x.x)";
    if (first >= 192 && first <= 223) return "Class C (192.x.x.x)";
    return "Public/Other";
  }

  return (
    <div className="p-3 border rounded bg-white/90">
      <div className="font-medium mb-2 text-sm">{title}</div>
      {hint && <div className="text-[10px] text-slate-500 mb-2 italic">{hint}</div>}
      <Labeled v="IP Address" value={host.ip} onChange={v=>onChange({...host, ip:v})} showValidation={(s)=>!!isValid(s)} ipClass={getIpClass(host.ip)} />
      <Labeled v="Subnet Mask" value={host.mask} onChange={v=>onChange({...host, mask:v})} placeholder="255.255.255.0" showValidation={(m)=>isMaskValid(m)} />
      <Labeled v="Gateway" value={host.gw} onChange={v=>onChange({...host, gw:v})} showValidation={(g)=>isValid(g) && gwMatchesSubnet(host.ip, g)} />
      <CommitBar committed={!!committedIp} onCommit={() => onCommit && onCommit()} disabled={!(isValid(host.ip) && isMaskValid(host.mask) && gwMatchesSubnet(host.ip, host.gw))} />
    </div>
  );
}
function LanRouterConfig({ lanR, onChange, committed, onCommit }:{ lanR:any; onChange:(r:any)=>void; committed?: boolean; onCommit?: ()=>void }) {
  return (
    <div className="p-3 border rounded bg-white/90">
      <div className="font-medium mb-2 text-sm">LAN Router</div>
      <div className="text-[10px] text-slate-500 mb-2 italic">Use 192.168.1.x range (e.g., 192.168.1.254)</div>
      <Labeled v="LAN IP" value={lanR.lanIp} onChange={v=>onChange({...lanR, lanIp:v})} showValidation={(s)=>!!s && s.startsWith("192.168.")} />
      <Labeled v="Gateway (to Firewall)" value={lanR.gw} onChange={v=>onChange({...lanR, gw:v})} placeholder="Must match Firewall LAN IP" />
      <CommitBar committed={!!committed} onCommit={() => onCommit && onCommit()} disabled={!(lanR.lanIp && lanR.lanIp.startsWith("192.168.") && !!lanR.gw)} />
    </div>
  );
}
function FirewallConfig({ fw, onChange, committed, onCommit }:{ fw:any; onChange:(f:any)=>void; committed?: boolean; onCommit?: ()=>void }) {
  return (
    <div className="p-3 border rounded col-span-2 bg-white/90">
      <div className="font-medium mb-2 text-sm">Firewall Interfaces</div>
      <div className="text-[10px] text-slate-500 mb-2 italic">DMZ: 10.x.x.x | LAN: 192.168.1.x | WAN: 203.0.113.x</div>
      <div className="grid grid-cols-3 gap-2">
        <Labeled v="DMZ Interface" value={fw.ifaces.dmz} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, dmz:v}})} placeholder="10.x.x.1" showValidation={(s)=>!!s && s.startsWith("10.")} />
        <Labeled v="LAN Interface" value={fw.ifaces.lan} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, lan:v}})} placeholder="192.168.1.1" showValidation={(s)=>!!s && s.startsWith("192.168.")} />
        <Labeled v="WAN Interface" value={fw.ifaces.wan} onChange={(v)=>onChange({...fw, ifaces:{...fw.ifaces, wan:v}})} placeholder="203.0.113.2" showValidation={(s)=>!!s && s.startsWith("203.0.113.")} />
      </div>
      <CommitBar committed={!!committed} onCommit={() => onCommit && onCommit()} disabled={!(fw.ifaces.dmz?.startsWith("10.") && fw.ifaces.lan?.startsWith("192.168.") && fw.ifaces.wan?.startsWith("203.0.113."))} />
    </div>
  );
}
function Labeled({ 
  v, 
  value, 
  onChange, 
  placeholder, 
  showValidation, 
  ipClass 
}: {
  v: string; 
  value: string; 
  onChange: (s: string) => void;
  placeholder?: string;
  showValidation?: (s: string) => boolean;
  /** IP class can be provided as a function (maps value -> class string) or a precomputed string */
  ipClass?: ((s: string) => string) | string;
}) {
  const isValid = showValidation ? showValidation(value) : true;
  const classInfo = ipClass && value 
    ? (typeof ipClass === "function" ? ipClass(value) : ipClass)
    : "";
  
      return (
        <label className="block text-[10px] mb-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-slate-600 font-medium">{v}</span>
            {showValidation && value && (
              <span className={`text-[9px] ${isValid ? "text-green-600" : "text-red-600"}`}>
                {isValid ? "✓" : "✗"}
              </span>
            )}
          </div>
          <input
            className={`w-full border rounded px-1.5 py-0.5 text-xs ${
              showValidation && value
                ? isValid
                  ? "border-green-300 bg-green-50/50"
                  : "border-red-300 bg-red-50/50"
                : "border-slate-300"
            }`}
            value={value}
            onChange={e=>onChange(e.target.value)}
            placeholder={placeholder || `Enter ${v.toLowerCase()}`}
          />
          {classInfo && value && (
            <div className="text-[8px] text-slate-500 mt-0.5 italic">{classInfo}</div>
          )}
        </label>
      );
    }