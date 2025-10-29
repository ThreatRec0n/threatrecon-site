import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import PacketList from '../components/PacketList';
import PacketDetail from '../components/PacketDetail';
import ChallengeEngine from '../components/ChallengeEngine';
import { parsePcapFile } from '../lib/pcap-parser-browser';
import { generateChallenge } from '../lib/synthetic-challenges';

export default function Home() {
  const [packets, setPackets] = useState([]);
  const [selectedPacketId, setSelectedPacketId] = useState(null);
  const [markedPacketIds, setMarkedPacketIds] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [level, setLevel] = useState('beginner');
  const [score, setScore] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [aiHintsEnabled, setAiHintsEnabled] = useState(false);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const selectedPacket = packets.find(p => p.id === selectedPacketId);

  useEffect(() => {
    setFadeIn(true);
    
    // Load saved progress
    if (typeof window !== 'undefined') {
      const savedScore = localStorage.getItem('packetHunt_score');
      if (savedScore) {
        setScore(parseInt(savedScore, 10) || 0);
      }
      
      const savedLevel = localStorage.getItem('packetHunt_level');
      if (savedLevel) {
        setLevel(savedLevel);
      }
    }
  }, []);

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
      alert('Failed to parse PCAP file. Try using a challenge instead.');
      if (process.env.NODE_ENV === 'development') {
        console.debug('PCAP parse error:', error);
      }
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
    const newScore = score + resultData.points;
    setScore(newScore);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('packetHunt_score', newScore.toString());
      const history = JSON.parse(localStorage.getItem('packetHunt_history') || '[]');
      history.push({
        timestamp: new Date().toISOString(),
        level,
        correct: resultData.correct,
        points: resultData.points,
        challenge: challenge.scenario.title,
      });
      localStorage.setItem('packetHunt_history', JSON.stringify(history.slice(-50)));
    }

    // Auto-advance level after successful challenges
    if (resultData.correct && score < 500 && newScore >= 500) {
      setLevel('intermediate');
      if (typeof window !== 'undefined') {
        localStorage.setItem('packetHunt_level', 'intermediate');
      }
    } else if (resultData.correct && score < 2000 && newScore >= 2000) {
      setLevel('advanced');
      if (typeof window !== 'undefined') {
        localStorage.setItem('packetHunt_level', 'advanced');
      }
    }
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
      } else if (e.key === 'm' || e.key === 'M') {
        if (selectedPacketId) {
          handleMarkAsEvidence(selectedPacketId);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIdx = packets.findIndex(p => p.id === selectedPacketId);
        if (currentIdx < packets.length - 1) {
          setSelectedPacketId(packets[currentIdx + 1]?.id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIdx = packets.findIndex(p => p.id === selectedPacketId);
        if (currentIdx > 0) {
          setSelectedPacketId(packets[currentIdx - 1]?.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [packets, selectedPacketId]);

  return (
    <>
      <Head>
        <title>ThreatRecon Packet Hunt</title>
        <meta name="description" content="Interactive Wireshark-style packet forensics learning game" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#00FF88" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen bg-gray-950 text-gray-200 flex flex-col font-sans ${fadeIn ? 'fade-in' : 'opacity-0'}`}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 shadow-[0_10px_40px_rgba(0,0,0,0.8)] px-4 py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-blue-400 font-semibold tracking-wide text-sm md:text-base">THREATRECON PACKET HUNT</div>
          <div className="flex items-center gap-3 text-[10px] md:text-xs">
            <span className="text-gray-400">Level:</span>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('packetHunt_level', e.target.value);
                }
              }}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-[10px] text-terminal-green font-mono"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <span className="text-gray-400">Score:</span>
            <span className="text-terminal-green font-mono font-bold">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-green"></span>
            </span>
            <span className="text-terminal-green font-mono text-[10px] md:text-xs">READY</span>
          </div>
        </header>

        <main className="flex-1 pt-[70px] pb-10 px-4 md:px-6 lg:px-8 max-w-[1800px] w-full mx-auto">
          {/* Title Banner */}
          <div className="title-banner fade-in mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-terminal-green font-mono tracking-wider text-center">
              PACKET FORENSICS GAME
            </h1>
          </div>

          {/* Controls Bar */}
          <div className="mb-4 flex flex-wrap gap-3 items-center justify-center">
            <button
              onClick={handleStartChallenge}
              disabled={loading}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg border border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.6)] py-2 px-4 font-mono transition-all duration-300 hover:scale-105"
            >
              {loading ? 'LOADING...' : 'START CHALLENGE'}
            </button>
            
            <label className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg border border-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.6)] py-2 px-4 font-mono cursor-pointer transition-all duration-300 hover:scale-105">
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
              onClick={() => setAiHintsEnabled(!aiHintsEnabled)}
              className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                aiHintsEnabled
                  ? 'bg-terminal-green/20 border border-terminal-green text-terminal-green'
                  : 'bg-gray-700 border border-gray-600 text-gray-400 hover:text-gray-300'
              }`}
            >
              AI Hints: {aiHintsEnabled ? 'ON' : 'OFF'}
            </button>

            {packets.length > 0 && (
              <div className="text-xs font-mono text-gray-400">
                {packets.length} packets loaded
              </div>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mb-4 text-center">
            <div className="inline-block bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-2 text-[9px] font-mono text-gray-400">
              Shortcuts: <kbd className="px-1 bg-gray-800 rounded">F</kbd> Filter | <kbd className="px-1 bg-gray-800 rounded">↑↓</kbd> Navigate | <kbd className="px-1 bg-gray-800 rounded">M</kbd> Mark Evidence
            </div>
          </div>

          {/* Main Content Grid */}
          {packets.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* Left: Packet List */}
              <div className="lg:col-span-2">
                <PacketList
                  packets={packets}
                  selectedPacketId={selectedPacketId}
                  onSelectPacket={handleSelectPacket}
                />
              </div>

              {/* Right: Packet Detail */}
              <div className="lg:col-span-1">
                <PacketDetail
                  packet={selectedPacket}
                  onMarkAsEvidence={handleMarkAsEvidence}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-8 text-center card-glow">
              <div className="text-gray-400 text-sm font-mono mb-4">
                No packets loaded. Start a challenge or upload a PCAP file to begin.
              </div>
              <div className="text-[10px] text-gray-500 font-mono space-y-1">
                <div>• Click "START CHALLENGE" for a synthetic packet capture scenario</div>
                <div>• Or click "UPLOAD PCAP" to analyze your own capture file</div>
              </div>
            </div>
          )}

          {/* Challenge Engine (Bottom or Sidebar) */}
          {challenge && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-1">
                <ChallengeEngine
                  challenge={challenge}
                  markedPacketIds={markedPacketIds}
                  onMarkPacket={handleMarkAsEvidence}
                  onSubmit={handleSubmitChallenge}
                  score={score}
                  level={level}
                  hintsUsed={hintsUsed}
                  onUseHint={handleUseHint}
                  aiHintsEnabled={aiHintsEnabled}
                />
              </div>
              <div className="lg:col-span-3 bg-gray-900/80 border border-gray-700 rounded-xl shadow-xl p-4 card-glow">
                <div className="text-xs uppercase tracking-wide text-gray-400 mb-2 font-mono">
                  Instructions
                </div>
                <div className="text-[10px] font-mono text-gray-300 space-y-2 leading-relaxed">
                  <div>1. Review the packet list and use filters to narrow down suspects</div>
                  <div>2. Click a packet to view detailed decoded fields, hex dump, and ASCII</div>
                  <div>3. When you find the evidence packet, click "MARK AS EVIDENCE"</div>
                  <div>4. Submit your findings to receive a score and explanation</div>
                  <div>5. Use hints sparingly - they reduce your final score</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
