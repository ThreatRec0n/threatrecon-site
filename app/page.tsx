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
import EnhancedPacketInspector from "@/components/EnhancedPacketInspector";
import LockoutOverlay from "@/components/LockoutOverlay";
import ScreenEffects from "@/components/ScreenEffects";
import ConceptMastery from "@/components/ConceptMastery";
import LearningPath from "@/components/LearningPath";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import AchievementGallery from "@/components/AchievementGallery";

type Tab = "Configure" | "Diagnostics" | "Firewall & NAT";

export default function Page() {
  const scn = scenarioData as Scenario;
  const [activeTab, setActiveTab] = useState<Tab>("Configure");
  
  // Initialize with empty IPs - users must configure everything
  const [fw, setFw] = useState<Firewall>({
    id: "fw1",
    ifaces: { dmz: "", lan: "", wan: "" },
    nat: {},
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
    gw: ""
  });
  // COMMITTED state (diagram and simulation consume these)
  const [cLan1, setCLan1] = useState<Host>({ id:"lan1", nic:"ens0", ip:"", mask:"", gw:"", role:"browser" });
  const [cLan2, setCLan2] = useState<Host>({ id:"lan2", nic:"ens1", ip:"", mask:"", gw:"" });
  const [cDmz1, setCDmz1] = useState<Host>({ id:"dmz1", nic:"ens0", ip:"", mask:"", gw:"" });
  const [cDmz2, setCDmz2] = useState<Host>({ id:"dmz2", nic:"ens1", ip:"", mask:"", gw:"" });
  const [cLanR, setCLanR] = useState({ id:"lan-r1", lanIp:"", gw:"" });
  const [cFw, setCFw] = useState<Firewall>({ id:"fw1", ifaces:{ dmz:"", lan:"", wan:"" }, nat:{}, rules:[] });

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
  const commitLanRouter = () => commitWithValidation("LAN_ROUTER", () => setCLanR({ ...lanR }), () => isValidIp(lanR.lanIp) && lanR.lanIp.startsWith("192.168.") && isValidIp(lanR.gw));
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
    // Determine which links are currently valid (only show when configured)
    const linkHostToLanRouter = cLan1.ip && cLanR.lanIp && inSame24(cLan1.ip, cLanR.lanIp) && cLan1.gw === cLanR.lanIp;
    const linkLanRouterToFw = cLanR.gw && cFw.ifaces.lan && cLanR.gw === cFw.ifaces.lan;
    const linkFwToWan = !!cFw.nat?.snat && cFw.nat?.snat?.outIface === "wan" && cFw.ifaces.wan;
    return {
      nodes: [
        { id:"DMZ1", x:110, y:180, label:"dmz1", ip:cDmz1.ip || "—", zone:"dmz", status: getNodeStatus("DMZ1") },
        { id:"DMZ2", x:110, y:260, label:"dmz2", ip:cDmz2.ip || "—", zone:"dmz", status: getNodeStatus("DMZ2") },
        { id:"FW", x:430, y:220, label:"firewall", ip:cFw.ifaces.wan || "—", zone:"wan", status: getNodeStatus("FW") },
        { id:"WAN_ROUTER", x:430, y:100, label:"wan gw", ip:scn.subnets.wan.gw, zone:"wan" },
        { id:"LAN_ROUTER", x:700, y:120, label:"lan rtr", ip:cLanR.lanIp || "—", zone:"lan", status: getNodeStatus("LAN_ROUTER") },
        { id:"LAN1", x:700, y:200, label:"lan1", ip:cLan1.ip || "—", zone:"lan", status: getNodeStatus("LAN1") },
        { id:"LAN2", x:700, y:280, label:"lan2", ip:cLan2.ip || "—", zone:"lan", status: getNodeStatus("LAN2") },
        { id:"INTERNET", x:430, y:36, label:"internet", ip:scn.internet.pingTarget, zone:"internet", status: "ok" as const }
      ],
      links: [
        { from:"DMZ1", to:"FW", ok:!!cDmz1.ip && !!cFw.ifaces.dmz, active:!!cDmz1.ip && !!cFw.ifaces.dmz },
        { from:"DMZ2", to:"FW", ok:!!cDmz2.ip && !!cFw.ifaces.dmz, active:!!cDmz2.ip && !!cFw.ifaces.dmz },
        { from:"LAN1", to:"LAN_ROUTER", ok:!!linkHostToLanRouter, active:!!linkHostToLanRouter },
        { from:"LAN2", to:"LAN_ROUTER", ok:!!(cLan2.ip && cLanR.lanIp && inSame24(cLan2.ip, cLanR.lanIp) && cLan2.gw===cLanR.lanIp), active:!!(cLan2.ip && cLanR.lanIp && inSame24(cLan2.ip, cLanR.lanIp) && cLan2.gw===cLanR.lanIp) },
        { from:"LAN_ROUTER", to:"FW", ok:!!linkLanRouterToFw, active:!!linkLanRouterToFw },
        { from:"FW", to:"WAN_ROUTER", ok:!!linkFwToWan, active:!!linkFwToWan },
        { from:"WAN_ROUTER", to:"INTERNET", ok:linkFwToWan, active:false }
      ]
    };
  }, [cDmz1, cDmz2, cFw, cLan1, cLan2, cLanR, failed, scn]);

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
      <div className="relative z-10 p-6 grid grid-cols-12 gap-4">
        {/* Animated Topology */}
        <section className="col-span-7 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/30 p-4">
          <h2 className="font-medium mb-2">Network Topology</h2>
          <TopologyCanvas nodes={topo.nodes as any} links={topo.links as any} packetPath={packetPath as any} natOverlay={natOverlay}/>
          <div className="mt-2 text-xs text-slate-500 space-y-1">
            <div>
              <span className="font-semibold text-red-400">⚠️ OBJECTIVE:</span> Configure all network devices with correct static IPs, gateways, firewall rules, and NAT to establish Internet connectivity.
            </div>
            <div className="text-slate-400">
              The door unlocks when {lan1.id} successfully reaches {scn.internet.pingTarget}. 
              <span className="font-mono text-slate-600"> Use private IP ranges (10.x, 172.x, 192.x) - see IP Range Guide above.</span>
            </div>
            {oxygenLevel < 30 && <span className="block mt-1 text-red-400 animate-pulse">⚡ CRITICAL: Oxygen running low! Configure faster!</span>}
          </div>
        </section>
        <section className="col-span-5 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700/30 p-4 flex flex-col">
          <div className="flex gap-2 text-sm">
            {(["Configure","Diagnostics","Firewall & NAT"] as Tab[]).map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} className={`px-3 py-1 border rounded ${activeTab===t?"bg-slate-900 text-white":"bg-white"}`}>{t}</button>
            ))}
          </div>
          <div className="mt-3">
            <HintPanel getHints={getHints}/>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-600">Difficulty:</span>
              <span className={`px-2 py-1 rounded font-semibold ${
                preset === "Beginner" ? "bg-emerald-100 text-emerald-800" :
                preset === "Intermediate" ? "bg-blue-100 text-blue-800" :
                "bg-red-100 text-red-800"
              }`}>
                {preset}
              </span>
            </div>
            <PracticeModeToggle enabled={practiceMode} onToggle={setPracticeMode} />
            <SubnetCalculator />
            <CommonMistakes />
            <ErrorTimeline errors={errorHistory} />
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
          {activeTab === "Configure" && (
            <div className="mt-3 space-y-4">
              <IPRangeGuide />
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <NetworkInfo subnet="lan" requiredRange="192.168.x.x /24" description="Internal LAN network - use Class C private range" />
                <NetworkInfo subnet="dmz" requiredRange="10.x.x.x /24" description="DMZ network - use Class A private range" />
                <NetworkInfo subnet="wan" requiredRange="203.0.113.x /24" description="WAN/Internet - use provided public range" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DeviceConfig title="LAN Host (browser)" host={lan1} onChange={setLan1} hint="Use 192.168.1.x range" committedIp={cLan1.ip} onCommit={commitLan1} />
                <DeviceConfig title="LAN Host 2" host={lan2} onChange={setLan2} hint="Optional - same range as LAN Host 1" committedIp={cLan2.ip} onCommit={commitLan2} />
                <DeviceConfig title="DMZ Host 1" host={dmz1} onChange={setDmz1} hint="Use 10.x.x.x range" committedIp={cDmz1.ip} onCommit={commitDmz1} />
                <DeviceConfig title="DMZ Host 2" host={dmz2} onChange={setDmz2} hint="Optional - same range as DMZ Host 1" committedIp={cDmz2.ip} onCommit={commitDmz2} />
                <LanRouterConfig lanR={lanR} onChange={setLanR} committed={!!cLanR.lanIp} onCommit={commitLanRouter} />
                <FirewallConfig fw={fw} onChange={setFw} committed={!!(cFw.ifaces.dmz||cFw.ifaces.lan||cFw.ifaces.wan)} onCommit={commitFirewall} />
              </div>
            </div>
          )}
          {activeTab === "Diagnostics" && (
            <div className="mt-3 text-sm">
              <NetTerminal exec={(cmd,args)=>{
                if (cmd==="ping") {
                  const res = pingFromHost(scn, cLan1, args[0] || scn.internet.pingTarget, cFw, cLanR);
                  setPings(p => p + 1);
                  setPacketPath(hopsToNodes(res.hops, scn, cLanR, cLan1.ip, cFw));
                  // Show NAT overlay if SNAT is active
                  if (cFw.nat?.snat && res.hops.includes(cFw.ifaces.wan)) {
                    setNatOverlay({ from: cLan1.ip, to: cFw.ifaces.wan, visible: true });
                    setTimeout(() => setNatOverlay(prev => ({ ...prev, visible: false })), 3000);
                  }
                  if (res.success) setStreak(s => s + 1);
                  else if (!practiceMode) setStreak(0);
                  try { new AudioContext().resume().then(()=>{ const a = new (window.AudioContext|| (window as any).webkitAudioContext)(); const o=a.createOscillator(); const g=a.createGain(); o.type='sine'; o.frequency.value = res.success? 880 : 220; o.connect(g); g.connect(a.destination); g.gain.setValueAtTime(0.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(0.1,a.currentTime+0.01); o.start(); o.stop(a.currentTime+0.15); }); } catch {}
                  setTrace({ command: "ping", args, hops: res.hops, success: res.success, reason: res.reason });
                  return res.success? "PING OK\n"+res.hops.join(" -> "): "PING FAIL: "+(res.reason||"blocked")+"\n"+res.hops.join(" -> ");
                }
                if (cmd==="traceroute") {
                  const r = tracerouteFromHost(scn, cLan1, args[0] || scn.internet.pingTarget, cFw, cLanR);
                  setPacketPath(hopsToNodes(r.hops, scn, cLanR, cLan1.ip, cFw));
                  setTrace({ command: "traceroute", args, hops: r.hops, success: r.reached });
                  return r.hops.join("\n");
                }
                if (cmd==="nslookup") {
                  const r = nslookupHost(scn, cLan1, args[0]);
                  return r.answer? `${args[0]} -> ${r.answer}` : "NXDOMAIN";
                }
                return "unknown command; type 'help'";
              }}/>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <ObjectivesPanel
                  title={`Objectives (${preset})`}
                  items={(() => {
                    const items = [
                      { id:"icmplan", text:"ICMP allowed on LAN+WAN", done: !!cFw.rules?.length },
                      { id:"snat", text:"SNAT 192.168.1.0/24 → FW WAN", done: !!cFw.nat?.snat && cFw.nat!.snat!.srcCidr.endsWith('/24') && cFw.nat!.snat!.toIp===cFw.ifaces.wan },
                      { id:"reach", text:"LAN1 can reach Internet target", done: isConnected },
                    ];
                    if (preset!=="Beginner") items.push({ id:"egress", text:"Default deny egress except required", done: true } as any);
                    return items as any;
                  })()} />
                <StateTable entries={trace? [{ src: cLan1.ip||"—", dst: (trace.args[0]||scn.internet.pingTarget), proto: "ICMP", state: trace.success?"ESTABLISHED":"BLOCKED" }]: []} />
                <RoutingTable
                  title="LAN Router Routes"
                  rows={[{ dest: "192.168.1.0/24", gateway: "—", iface: "lan" }, { dest: "0.0.0.0/0", gateway: cLanR.gw||"—", iface: "lan" }]}
                />
                <RoutingTable
                  title="Firewall Routes"
                  rows={[{ dest: "10.0.0.0/8", gateway: "—", iface: "dmz" }, { dest: "192.168.1.0/24", gateway: "—", iface: "lan" }, { dest: "0.0.0.0/0", gateway: scn.subnets.wan.gw, iface: "wan" }]}
                />
                <ChecklistPanel items={[
                  { id:"lan1", label:"LAN Host committed", ok: !!cLan1.ip, hint:"Commit LAN host" },
                  { id:"lanr", label:"LAN Router committed", ok: !!cLanR.lanIp, hint:"Commit LAN router" },
                  { id:"fwlan", label:"Firewall LAN committed", ok: !!cFw.ifaces.lan, hint:"Commit Firewall LAN" },
                  { id:"fwwan", label:"Firewall WAN committed", ok: !!cFw.ifaces.wan, hint:"Commit Firewall WAN (203.0.113.x)" },
                  { id:"snat", label:"SNAT configured /24", ok: !!cFw.nat?.snat && cFw.nat!.snat!.srcCidr.endsWith('/24'), hint:"Set SNAT 192.168.1.0/24 → FW WAN" },
                ]} />
                <LintPanel items={(()=>{
                  const out: {id:string;msg:string}[] = [];
                  const same24 = (a?:string,b?:string)=>!!a&&!!b&&a.split('.').slice(0,3).join('.')===b.split('.').slice(0,3).join('.');
                  if (cLan1.ip && cLan1.gw && !same24(cLan1.ip,cLan1.gw)) out.push({id:"gw", msg:"LAN Host gateway not in same /24 as host"});
                  if (cLanR.lanIp && !(cLanR.lanIp.startsWith('192.168.'))) out.push({id:"lanrip", msg:"LAN Router should be 192.168.x.x"});
                  if (cFw.ifaces.dmz && !cFw.ifaces.dmz.startsWith('10.')) out.push({id:"dmz", msg:"Firewall DMZ should be 10.x.x.x"});
                  if (cFw.ifaces.wan && !cFw.ifaces.wan.startsWith('203.0.113.')) out.push({id:"wan", msg:"Firewall WAN should be 203.0.113.x"});
                  return out;
                })()} />
                <EnhancedPacketInspector 
                  src={cLan1.ip} 
                  dst={(trace?.args?.[0]||scn.internet.pingTarget)} 
                  translatedSrc={cFw.ifaces.wan && cFw.nat?.snat ? cFw.ifaces.wan : undefined}
                  hops={trace?.hops}
                />
                <PacketFlowAnim hops={trace?.hops?.map((h,i)=>({
                  ip: h,
                  label: i===0?"LAN Host":i===1?"LAN Router":i===2?"Firewall":i===3?"WAN":"Internet",
                  headers: { src: i===0?cLan1.ip:undefined, dst: i===trace.hops.length-1?scn.internet.pingTarget:undefined, ttl: 64-i }
                })) || []} />
                <NatTable entries={cFw.nat?.snat && cLan1.ip ? [{ src: cLan1.ip, to: cFw.nat.snat.toIp, iface: cFw.nat.snat.outIface }]: []} />
              </div>
              <div className="mt-3 flex items-center justify-center gap-4">
                <ProgressRing progress={completionProgress} label="Complete" />
              </div>
              <div className="mt-3">
                <AchievementGallery earned={achievements} />
              </div>
              <div className="mt-3 flex gap-2 text-xs">
                <button onClick={()=>{ commitLan1(); commitLan2(); commitDmz1(); commitDmz2(); commitLanRouter(); commitFirewall(); }} className="px-3 py-1 border rounded bg-slate-900 text-white">Commit All</button>
                <button onClick={()=>{
                  const blob = new Blob([JSON.stringify({ cLan1,cLan2,cDmz1,cDmz2,cLanR,cFw }, null, 2)], {type:'application/json'});
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'net-config.json'; a.click();
                  URL.revokeObjectURL(url);
                }} className="px-2 py-1 border rounded">Export Config</button>
                <label className="px-2 py-1 border rounded cursor-pointer">
                  Import
                  <input type="file" accept="application/json" className="hidden" onChange={async (e)=>{
                    const f = e.target.files?.[0]; if(!f) return; const txt = await f.text();
                    try { const j = JSON.parse(txt);
                      setCLan1(j.cLan1||cLan1); setCLan2(j.cLan2||cLan2); setCDmz1(j.cDmz1||cDmz1); setCDmz2(j.cDmz2||cDmz2); setCLanR(j.cLanR||cLanR); setCFw(j.cFw||cFw);
                    } catch {}
                  }} />
                </label>
                <button onClick={()=>{
                  if (cLanR.gw) setCLanR(r=>({ ...r, gw: "192.168.1.254" }));
                  else if (cFw.ifaces.wan) setCFw(f=>({ ...f, ifaces:{...f.ifaces, wan: "203.0.114.2"}}));
                  else setCLan1(h=>({ ...h, gw: "192.168.2.1" }));
                }} className="px-2 py-1 border rounded">Break Something</button>
              </div>
            </div>
          )}
          {activeTab === "Firewall & NAT" && (
            <div className="mt-3 text-sm">
              <NatFirewallPanel fw={fw} onChange={setFw}/>
            </div>
          )}
        </section>
      </div>
      <RuleTraceModal trace={trace} onClose={()=>setTrace(null)} />
      <HelpOverlay open={helpOpen} onClose={()=>setHelpOpen(false)} />
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
  };

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
    <label className="block text-xs mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-slate-600 font-medium">{v}</span>
        {showValidation && value && (
          <span className={`text-[10px] ${isValid ? "text-green-600" : "text-red-600"}`}>
            {isValid ? "✓" : "✗ Invalid"}
          </span>
        )}
      </div>
      <input
        className={`mt-1 w-full border rounded px-2 py-1 text-sm ${
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
        <div className="text-[9px] text-slate-500 mt-0.5 italic">{classInfo}</div>
      )}
    </label>
  );
}