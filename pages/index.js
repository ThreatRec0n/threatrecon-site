import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import PacketList from '../components/PacketList';
import PacketDetail from '../components/PacketDetail';
import ChallengeEngine from '../components/ChallengeEngine';
import ScenarioPicker from '../components/ScenarioPicker';
import VoipPanel from '../components/VoipPanel';
import TimelinePlayer from '../components/TimelinePlayer';
import { createRound } from '../lib/round-engine';
import HelpModal from '../components/HelpModal';
import ProtocolGuideModal from '../components/ProtocolGuideModal';
import ProtocolIntelModal from '../components/ProtocolIntelModal';
import StudyPackModal from '../components/StudyPackModal';
import { parsePcapFile } from '../lib/pcap-parser-browser';
import { usePacketStream } from '../lib/usePacketStream';
import { buildTcpStreams } from '../lib/stream-builder';

export default function Home() {
  const [selectedPacketId, setSelectedPacketId] = useState(null);
  const [markedPacketIds, setMarkedPacketIds] = useState([]);
  const [scenarioId, setScenarioId] = useState('mixed');
  const [difficulty, setDifficulty] = useState('beginner');
  const [packetCount, setPacketCount] = useState(35);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tcpStreams, setTcpStreams] = useState({});
  const [roundPackets, setRoundPackets] = useState([]);
  const [groundTruth, setGroundTruth] = useState({ ids: [], reason: '', rubric: [] });
  const [showProtocolGuide, setShowProtocolGuide] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showStudyPack, setShowStudyPack] = useState(false);
  
  const fileInputRef = useRef(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState('beginner');

  const packets = roundPackets;

  // Load saved progress
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const profile = JSON.parse(localStorage.getItem('threatrecon_packet_hunt_profile') || '{}');
      if (profile.score !== undefined) {
        setScore(profile.score);
      }
      if (profile.level) {
        const savedLevel = profile.level.toLowerCase();
        setLevel(savedLevel);
        setDifficulty(savedLevel);
      }
    }
  }, []);

  // Build TCP streams when packets change
  useEffect(() => {
    if (packets.length > 0) {
      const streams = buildTcpStreams(packets);
      setTcpStreams(streams);
    }
  }, [packets]);

  const saveProfile = (newScore, correct, scenarioTitle, scoreDelta) => {
    if (typeof window === 'undefined') return;
    
    const profile = JSON.parse(localStorage.getItem('threatrecon_packet_hunt_profile') || '{}');
    
    let newLevel = 'beginner';
    if (newScore >= 2000) newLevel = 'advanced';
    else if (newScore >= 500) newLevel = 'intermediate';
    
    profile.score = newScore;
    profile.level = newLevel.charAt(0).toUpperCase() + newLevel.slice(1);
    
    if (!profile.history) profile.history = [];
    profile.history.push({
      ts: new Date().toISOString(),
      scenarioId: scenarioTitle,
      result: correct ? 'correct' : 'wrong',
      scoreDelta,
      learned: correct ? ['Correctly identified evidence packet'] : ['Review packet structure', 'Check protocol layers'],
    });
    
    profile.history = profile.history.slice(-100);
    localStorage.setItem('threatrecon_packet_hunt_profile', JSON.stringify(profile));
    setLevel(newLevel);
    setDifficulty(newLevel);
  };

  const PACKET_COUNTS = { beginner: 25, intermediate: 50, advanced: 100 };

  const handleNewRound = async () => {
    try {
      // Immediately set loading state so UI is stable
      setIsStreaming(false);
      setRoundPackets([]);           // clear previous packets
      setSelectedPacketId(null);     // clear selection
      setMarkedPacketIds([]);        // clear marks
      setGroundTruth({ ids: [], reason: '', rubric: [] });

      // determine count based on difficulty
      const packetCount = PACKET_COUNTS[difficulty] || 25;

      // call scenario generator - must return an array of packets
      const { packets: newPkts, groundTruth: gt, hints } = await createRound({ 
        scenarioId, 
        difficulty, 
        packetCountRange: [packetCount, packetCount] 
      });

      // defensive check
      if (!Array.isArray(newPkts)) {
        console.error('createRound returned invalid packets:', newPkts);
        throw new Error('Invalid packet generation result');
      }

      // set UI state
      setRoundPackets(newPkts);
      setGroundTruth(gt);
      setIsStreaming(false);

    } catch (err) {
      console.error('New round failed', err);
      // Show friendly error instead of full reload
      alert('Could not start a new round. Please try again. Error: ' + err.message);
      setIsStreaming(false);
      // do NOT call window.location.reload(); let user retry
    }
  };

  const handlePause = () => { setIsStreaming(false); };
  const handleResume = () => { setIsStreaming(false); };

  // Upload PCAP functionality removed - training mode only

  const handleSelectPacket = (packetId) => {
    setSelectedPacketId(packetId);
    setTimeout(() => {
      const element = document.querySelector(`[data-packet-id="${packetId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleMarkAsEvidence = (packetId) => {
    setMarkedPacketIds(prev => {
      if (prev.includes(packetId)) {
        return prev.filter(id => id !== packetId);
      }
      return [...prev, packetId];
    });
  };

  const handleSubmitChallenge = (resultData) => {
    const newScore = resultData.correct ? score + resultData.points : Math.max(0, score - 50);
    setScore(newScore);
    saveProfile(newScore, resultData.correct, resultData.scenarioTitle || profileType, resultData.points);
    
    // After debrief, offer new round
    setTimeout(() => {
      if (confirm('Start a new round?')) {
        handleStart();
      }
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'f' || e.key === 'F') {
        const filterInput = document.querySelector('input[placeholder*="Filter"]');
        if (filterInput) filterInput.focus();
        e.preventDefault();
      } else if (e.key === 'm' || e.key === 'M') {
        if (selectedPacketId) {
          handleMarkAsEvidence(selectedPacketId);
          e.preventDefault();
        }
      } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        const currentIdx = packets.findIndex(p => p.id === selectedPacketId);
        if (currentIdx < packets.length - 1) {
          handleSelectPacket(packets[currentIdx + 1]?.id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = packets.findIndex(p => p.id === selectedPacketId);
        if (currentIdx > 0) {
          handleSelectPacket(packets[currentIdx - 1]?.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [packets, selectedPacketId]);

  const selectedPacket = packets.find(p => p.id === selectedPacketId);
  const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <>
      <Head>
        <title>ThreatRecon Packet Hunt v3.0</title>
        <meta name="description" content="Interactive Wireshark-style packet forensics learning game" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#00FF88" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans">
        {/* Fixed Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-4 py-3">
          <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="text-terminal-green font-bold tracking-wider text-base md:text-lg font-mono shadow-[0_0_10px_rgba(0,255,136,0.5)]">
              THREATRECON PACKET HUNT
            </div>
            
            <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Level:</span>
                <span className="text-terminal-green font-semibold">{levelDisplay}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Score:</span>
                <span className="text-terminal-green font-bold">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {!isStreaming && packets.length === 0 ? (
                <button
                  onClick={handleNewRound}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg border border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.6)] px-3 py-1.5 font-mono transition-all"
                >
                  NEW ROUND
                </button>
              ) : isStreaming ? (
                <>
                  <button
                    onClick={handlePause}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold text-xs rounded-lg border border-yellow-400 px-3 py-1.5 font-mono transition-all"
                  >
                    PAUSE CAPTURE
                  </button>
                </>
              ) : (
                <button
                  onClick={handleResume}
                  className="bg-green-600 hover:bg-green-500 text-white font-semibold text-xs rounded-lg border border-green-400 px-3 py-1.5 font-mono transition-all"
                >
                  RESUME
                </button>
              )}
              
              {/* Upload PCAP removed - training mode only */}
              
              <button
                onClick={() => setShowHelp(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs rounded-lg border border-gray-600 px-3 py-1.5 font-mono transition-all"
              >
                HELP
              </button>

              <button
                onClick={() => setShowProtocolGuide(true)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs rounded-lg border border-gray-700 px-3 py-1.5 font-mono transition-all"
              >
                PROTOCOL GUIDE
              </button>

              <button
                onClick={() => setShowIntel(true)}
                className="ml-0 md:ml-2 px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-white font-mono border border-slate-700"
              >
                PROTOCOL INTEL
              </button>

              <button
                onClick={() => setShowStudyPack(true)}
                className="ml-0 md:ml-2 px-3 py-1 text-xs bg-purple-800 hover:bg-purple-700 rounded text-white font-mono border border-purple-700"
              >
                STUDY PACK
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - 3 Column Layout */}
        <main className="flex-1 pt-[110px] pb-4 px-2 md:px-4 lg:px-6 max-w-[1800px] w-full mx-auto">
          {/* Scenario Picker */}
          <div className="mb-3">
            <ScenarioPicker
              scenarioId={scenarioId}
              difficulty={difficulty}
              packetCount={packetCount}
              isDisabled={false}
              onChange={(c)=>{
                if (c.scenarioId) setScenarioId(c.scenarioId);
                if (c.difficulty) setDifficulty(c.difficulty);
                if (typeof c.packetCount === 'number') setPacketCount(c.packetCount);
              }}
              onNewRound={handleNewRound}
            />
          </div>

          {packets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-120px)]">
              {/* Left: PacketList */}
              <div className="lg:col-span-4">
                <PacketList
                  packets={packets}
                  selectedPacketId={selectedPacketId}
                  onSelectPacket={handleSelectPacket}
                  markedPacketIds={markedPacketIds}
                  isStreaming={false}
                />
              </div>

              {/* Center: PacketDetail */}
              <div className="lg:col-span-5">
                <PacketDetail
                  packet={selectedPacket}
                  onMarkAsEvidence={handleMarkAsEvidence}
                  markedPacketIds={markedPacketIds}
                  tcpStreams={tcpStreams}
                  allPackets={packets}
                />
              </div>

              {/* Right: Calls / Briefing */}
              <div className="lg:col-span-3 space-y-3">
                <TimelinePlayer
                  packets={packets}
                  onTick={(p)=> setSelectedPacketId(p.id)}
                />
                <VoipPanel
                  packets={packets}
                  onSelectPacket={handleSelectPacket}
                />
                <ChallengeEngine
                  scenarioId={scenarioId}
                  difficulty={difficulty}
                  markedPacketIds={markedPacketIds}
                  selectedPacketId={selectedPacketId}
                  onMarkPacket={handleMarkAsEvidence}
                  onValidated={(res)=> handleSubmitChallenge({ correct: res.correct, points: res.scoreDelta, scenarioTitle: scenarioId })}
                  score={score}
                  groundTruth={groundTruth}
                  packets={packets}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-120px)]">
              <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-8 text-center card-glow max-w-2xl">
                <div className="text-gray-400 text-lg font-mono mb-4">
                  Welcome to ThreatRecon Packet Hunt (Round Mode)
                </div>
                <div className="text-gray-500 text-sm font-mono space-y-2 mb-6">
                  <div>Select a scenario and difficulty, then click NEW ROUND to generate a small realistic capture.</div>
                  <div>Use filters, inspect packets, mark evidence, and submit your findings.</div>
                </div>
                <button
                  onClick={handleNewRound}
                  className="bg-red-600 hover:bg-red-500 text-white font-semibold text-sm rounded-lg border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] px-6 py-3 font-mono transition-all"
                >
                  NEW ROUND
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Help Modal */}
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
        <ProtocolGuideModal open={showProtocolGuide} onClose={() => setShowProtocolGuide(false)} />
        {showIntel && <ProtocolIntelModal open onClose={() => setShowIntel(false)} />}
        <StudyPackModal isOpen={showStudyPack} onClose={() => setShowStudyPack(false)} />
      </div>
    </>
  );
}
