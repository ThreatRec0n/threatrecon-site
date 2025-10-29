import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import PacketList from '../components/PacketList';
import PacketDetail from '../components/PacketDetail';
import ChallengeEngine from '../components/ChallengeEngine';
import HelpModal from '../components/HelpModal';
import { parsePcapFile } from '../lib/pcap-parser-browser';
import { generateChallenge } from '../lib/synthetic-challenges';
import { buildTcpStreams, getFiveTupleKey } from '../lib/stream-builder';

export default function Home() {
  const [packets, setPackets] = useState([]);
  const [selectedPacketId, setSelectedPacketId] = useState(null);
  const [markedPacketIds, setMarkedPacketIds] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [level, setLevel] = useState('beginner');
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [tcpStreams, setTcpStreams] = useState({});
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const selectedPacket = packets.find(p => p.id === selectedPacketId);

  useEffect(() => {
    // Load saved progress
    if (typeof window !== 'undefined') {
      const profile = JSON.parse(localStorage.getItem('threatrecon_packet_hunt_profile') || '{}');
      if (profile.score !== undefined) {
        setScore(profile.score);
      }
      if (profile.level) {
        setLevel(profile.level.toLowerCase());
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
    
    // Determine level
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
    
    // Keep last 100 entries
    profile.history = profile.history.slice(-100);
    
    localStorage.setItem('threatrecon_packet_hunt_profile', JSON.stringify(profile));
    setLevel(newLevel);
  };

  const handleUploadPcap = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const parsedPackets = await parsePcapFile(file);
      setPackets(parsedPackets);
      setChallenge(null);
      setMarkedPacketIds([]);
      setSelectedPacketId(null);
    } catch (error) {
      // Fallback to synthetic challenge
      const challengeData = generateChallenge(level);
      setPackets(challengeData.packets);
      setChallenge(challengeData);
      alert('PCAP upload failed. Showing a challenge instead.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleStartChallenge = () => {
    setLoading(true);
    setTimeout(() => {
      const challengeData = generateChallenge(level);
      setPackets(challengeData.packets);
      setChallenge(challengeData);
      setMarkedPacketIds([]);
      setSelectedPacketId(null);
      setHintsUsed(0);
      setLoading(false);
    }, 300);
  };

  const handleSelectPacket = (packetId) => {
    setSelectedPacketId(packetId);
    // Scroll into view
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
    const newScore = resultData.correct ? score + resultData.points : Math.max(0, score - 10);
    setScore(newScore);
    saveProfile(newScore, resultData.correct, challenge.scenario.title, resultData.points);
  };

  const handleUseHint = () => {
    if (hintsUsed < 3 && challenge) {
      setHintsUsed(prev => prev + 1);
    }
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
          const nextPacket = packets[currentIdx + 1];
          if (nextPacket) {
            handleSelectPacket(nextPacket.id);
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = packets.findIndex(p => p.id === selectedPacketId);
        if (currentIdx > 0) {
          const prevPacket = packets[currentIdx - 1];
          if (prevPacket) {
            handleSelectPacket(prevPacket.id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [packets, selectedPacketId]);

  const levelDisplay = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <>
      <Head>
        <title>ThreatRecon Packet Hunt</title>
        <meta name="description" content="Interactive Wireshark-style packet forensics learning game" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#00FF88" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans">
        {/* Fixed Top Bar */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-4 py-3">
          <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-terminal-green font-bold tracking-wider text-lg md:text-xl font-mono shadow-[0_0_10px_rgba(0,255,136,0.5)]">
              THREATRECON PACKET HUNT
            </div>
            <div className="flex items-center gap-4 text-sm font-mono">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Level:</span>
                <span className="text-terminal-green font-semibold">{levelDisplay}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Score:</span>
                <span className="text-terminal-green font-bold">{score}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStartChallenge}
                disabled={loading}
                className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg border border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.6)] px-3 py-1.5 font-mono transition-all"
              >
                START CHALLENGE
              </button>
              <label className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg border border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.6)] px-3 py-1.5 font-mono cursor-pointer transition-all">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pcap,.cap"
                  onChange={handleUploadPcap}
                  className="hidden"
                />
                UPLOAD PCAP
              </label>
              <button
                onClick={() => setShowHelp(true)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs rounded-lg border border-gray-600 px-3 py-1.5 font-mono transition-all"
              >
                HELP
              </button>
            </div>
          </div>
        </header>

        {/* Main Content - 3 Column Layout */}
        <main className="flex-1 pt-[90px] pb-4 px-2 md:px-4 lg:px-6 max-w-[1800px] w-full mx-auto">
          {packets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-[calc(100vh-110px)]">
              {/* Left: PacketList */}
              <div className="lg:col-span-4">
                <PacketList
                  packets={packets}
                  selectedPacketId={selectedPacketId}
                  onSelectPacket={handleSelectPacket}
                  markedPacketIds={markedPacketIds}
                />
              </div>

              {/* Center: PacketDetail */}
              <div className="lg:col-span-5">
                <PacketDetail
                  packet={selectedPacket}
                  onMarkAsEvidence={handleMarkAsEvidence}
                  markedPacketIds={markedPacketIds}
                  tcpStreams={tcpStreams}
                />
              </div>

              {/* Right: Challenge Engine / Briefing */}
              <div className="lg:col-span-3">
                <ChallengeEngine
                  challenge={challenge}
                  markedPacketIds={markedPacketIds}
                  selectedPacketId={selectedPacketId}
                  onMarkPacket={handleMarkAsEvidence}
                  onSubmit={handleSubmitChallenge}
                  score={score}
                  level={level}
                  hintsUsed={hintsUsed}
                  onUseHint={handleUseHint}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-110px)]">
              <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-8 text-center card-glow max-w-2xl">
                <div className="text-gray-400 text-lg font-mono mb-4">
                  Welcome to ThreatRecon Packet Hunt
                </div>
                <div className="text-gray-500 text-sm font-mono space-y-2 mb-6">
                  <div>Start a challenge or upload a PCAP file to begin packet analysis.</div>
                  <div>Use filters, inspect packets, mark evidence, and submit your findings.</div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleStartChallenge}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] px-6 py-3 font-mono transition-all"
                  >
                    {loading ? 'LOADING...' : 'START CHALLENGE'}
                  </button>
                  <button
                    onClick={() => setShowHelp(true)}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg border border-gray-600 px-6 py-3 font-mono transition-all"
                  >
                    VIEW HELP
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Help Modal */}
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </>
  );
}
