"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import PacketList from './PacketList';
import PacketDetail from './PacketDetail';
import HexView from './HexView';
import ChallengeEngine from './ChallengeEngine';
import ScenarioPicker from './ScenarioPicker';
import VoipPanel from './VoipPanel';
import TimelinePlayer from './TimelinePlayer';
import { newRound } from '../lib/round-engine';
import { useRoundBudget, useEvidenceCount } from '../lib/useRoundBudget';
import { toast } from '../utils/toast';
import HelpModal from './HelpModal';
import ProtocolGuideModal from './ProtocolGuideModal';
import ProtocolIntelModal from './ProtocolIntelModal';
import StudyPackModal from './StudyPackModal';
import { buildTcpStreams } from '../lib/stream-builder';

export default function HomeApp(){
  useEffect(()=>{ console.log('Home mounted OK'); },[]);
  const [selectedPacketId, setSelectedPacketId] = useState(null);
  const [markedPacketIds, setMarkedPacketIds] = useState([]);
  const [scenarioId, setScenarioId] = useState('http-exfil');
  const [difficulty, setDifficulty] = useState('beginner');
  const { budget } = useRoundBudget(difficulty);
  const [roundHealth, setRoundHealth] = useState('ok');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tcpStreams, setTcpStreams] = useState({});
  const [roundPackets, setRoundPackets] = useState([]);
  const [groundTruth, setGroundTruth] = useState({ ids: [], reason: '', rubric: [] });
  const [showProtocolGuide, setShowProtocolGuide] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showStudyPack, setShowStudyPack] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState('beginner');

  const packets = roundPackets;
  const markedCount = useEvidenceCount(markedPacketIds);
  const visibleCount = packets.length;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const profile = JSON.parse(localStorage.getItem('threatrecon_packet_hunt_profile') || '{}');
      if (profile.score !== undefined) setScore(profile.score);
      if (profile.level) {
        const savedLevel = profile.level.toLowerCase();
        setLevel(savedLevel);
        setDifficulty(savedLevel);
      }
      const prefs = JSON.parse(localStorage.getItem('tr_round_prefs') || '{}');
      if (prefs.difficulty) setDifficulty(String(prefs.difficulty).toLowerCase());
      if (prefs.scenarioId) setScenarioId(prefs.scenarioId);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefs = { difficulty, scenarioId };
      localStorage.setItem('tr_round_prefs', JSON.stringify(prefs));
    }
  }, [difficulty, scenarioId]);

  useEffect(() => {
    if (packets.length > 0) setTcpStreams(buildTcpStreams(packets));
  }, [packets]);

  const handleNewRound = async () => {
    try {
      setIsStreaming(false);
      setRoundPackets([]);
      setSelectedPacketId(null);
      setMarkedPacketIds([]);
      setGroundTruth({ ids: [], reason: '', rubric: [] });
      setRoundHealth('ok');
      const { packets: newPkts } = await newRound({ difficulty: level.charAt(0).toUpperCase() + level.slice(1), profile: scenarioId, buildScenario: async ({ template, totalPackets, evidencePackets }) => {
        const { SCENARIOS } = await import('../lib/scenario-catalog');
        const scen = SCENARIOS[template] || SCENARIOS.mixed || Object.values(SCENARIOS)[0];
        if (scen && typeof scen.generate === 'function') {
          const r = scen.generate({ difficulty: level.charAt(0).toUpperCase() + level.slice(1), packetCount: totalPackets, evidenceCount: evidencePackets, seed: Date.now() });
          return { packets: r.packets || [], evidenceIds: r.groundTruth?.ids || [], briefing: r.groundTruth?.reason };
        }
        return { packets: [], evidenceIds: [], briefing: '' };
      }});
      if (!Array.isArray(newPkts)) throw new Error('Invalid packet generation result');
      setRoundPackets(newPkts);
      setIsStreaming(false);
      setRoundHealth('ok');
    } catch (err) {
      console.error('New round failed', err);
      toast('New Round failed. State was reset. Try again.');
      setIsStreaming(false);
      setRoundHealth('warn');
    }
  };

  const handleSelectPacket = (packetId) => {
    setSelectedPacketId(packetId);
    setTimeout(() => {
      const element = document.querySelector(`[data-packet-id="${packetId}"]`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleMarkAsEvidence = (packetId) => {
    setMarkedPacketIds(prev => prev.includes(packetId) ? prev.filter(id => id !== packetId) : [...prev, packetId]);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'm' || e.key === 'M') && selectedPacketId) { e.preventDefault(); handleMarkAsEvidence(selectedPacketId); }
      if (e.key === 'ArrowDown' || e.key === 'Enter') { e.preventDefault(); const idx = packets.findIndex(p=>p.id===selectedPacketId); if (idx < packets.length - 1) handleSelectPacket(packets[idx+1]?.id); }
      if (e.key === 'ArrowUp') { e.preventDefault(); const idx = packets.findIndex(p=>p.id===selectedPacketId); if (idx > 0) handleSelectPacket(packets[idx-1]?.id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [packets, selectedPacketId]);

  const selectedPacket = packets.find(p => p.id === selectedPacketId);
  const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <>
      <Head>
        <title>ThreatRecon Packet Hunt v3.0</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans">
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 px-4 py-3">
          <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="text-terminal-green font-bold tracking-wider text-base md:text-lg font-mono">Threat Recon</div>
            <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
              <div className="flex items-center gap-2"><span className="text-gray-400">Level:</span><span className="text-terminal-green font-semibold">{levelDisplay}</span></div>
              <div className="flex items-center gap-2"><span className="text-gray-400">Score:</span><span className="text-terminal-green font-bold">{score}</span></div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleNewRound} className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg border border-red-400 px-3 py-1.5 font-mono">NEW ROUND</button>
              <span aria-label={roundHealth==='ok'?'Round healthy':'Round warning'} className={`inline-block h-2 w-2 rounded-full ${roundHealth==='ok'?'bg-green-500':'bg-amber-400'}`}></span>
              <div className="px-3 py-1 rounded-md border border-zinc-700 text-zinc-200 font-mono text-[11px]">Packets: {visibleCount}/{budget} • Evidence marked: {markedCount}</div>
              <button onClick={()=>setShowHelp(true)} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs rounded-lg border border-gray-600 px-3 py-1.5 font-mono">HELP</button>
              <button onClick={()=>setShowProtocolGuide(true)} className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs rounded-lg border border-gray-700 px-3 py-1.5 font-mono">PROTOCOL GUIDE</button>
              <button onClick={()=>setShowIntel(true)} className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-white font-mono border border-slate-700">PROTOCOL INTEL</button>
              <button onClick={()=>setShowStudyPack(true)} className="px-3 py-1 text-xs bg-purple-800 hover:bg-purple-700 rounded text-white font-mono border border-purple-700">STUDY PACK</button>
            </div>
          </div>
        </header>
        <main className="flex-1 pt-[110px] pb-4 px-2 md:px-4 lg:px-6 max-w-[1800px] w-full mx-auto">
          <div className="mb-3">
            <ScenarioPicker scenarioId={scenarioId} difficulty={difficulty} packetCount={0} isDisabled={false} onChange={(c)=>{ if (c.scenarioId) setScenarioId(c.scenarioId); if (c.difficulty) setDifficulty(c.difficulty); }} onNewRound={handleNewRound} />
          </div>
          {packets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-120px)]">
              <div className="lg:col-span-4"><PacketList packets={packets} selectedPacketId={selectedPacketId} onSelectPacket={handleSelectPacket} markedPacketIds={markedPacketIds} isStreaming={false} /></div>
              <div className="lg:col-span-5 flex flex-col min-h-0">
                <PacketDetail packet={selectedPacket} onMarkAsEvidence={handleMarkAsEvidence} markedPacketIds={markedPacketIds} tcpStreams={tcpStreams} allPackets={packets} />
                <HexView raw={selectedPacket?.raw || selectedPacket?.rawBytes} />
              </div>
              <div className="lg:col-span-3 space-y-3"><TimelinePlayer packets={packets} onTick={(p)=> setSelectedPacketId(p.id)} /><VoipPanel packets={packets} onSelectPacket={handleSelectPacket} /><ChallengeEngine scenarioId={scenarioId} difficulty={difficulty} markedPacketIds={markedPacketIds} selectedPacketId={selectedPacketId} onMarkPacket={handleMarkAsEvidence} onValidated={()=>{}} score={score} groundTruth={groundTruth} packets={packets} /></div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-120px)]"><div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-8 text-center card-glow max-w-2xl"><div className="text-gray-400 text-lg font-mono mb-4">Welcome to ThreatRecon Packet Hunt (Round Mode)</div><div className="text-gray-500 text-sm font-mono space-y-2 mb-6"><div>Select a scenario and difficulty, then click NEW ROUND to generate a small realistic capture.</div><div>Use filters, inspect packets, mark evidence, and submit your findings.</div></div><button onClick={handleNewRound} className="bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-lg border border-red-400 px-6 py-3 font-mono">NEW ROUND</button></div></div>
          )}
        </main>
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <ProtocolGuideModal open={showProtocolGuide} onClose={() => setShowProtocolGuide(false)} />
        {showIntel && <ProtocolIntelModal open onClose={() => setShowIntel(false)} />}
        <StudyPackModal isOpen={showStudyPack} onClose={() => setShowStudyPack(false)} />
      </div>
    </>
  );
}


