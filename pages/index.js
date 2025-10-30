import dynamic from 'next/dynamic';
export async function getStaticProps(){ return { props:{}, revalidate:300 }; }
const HomeApp = dynamic(() => import('../components/HomeApp'), { ssr:false });
export default function Page(){ return <HomeApp/>; }

export default function Home() {
  const [selectedPacketId, setSelectedPacketId] = useState(null);
  const [markedPacketIds, setMarkedPacketIds] = useState([]);
  const [scenarioId, setScenarioId] = useState('http-exfil');
  const [difficulty, setDifficulty] = useState('beginner');
  const { budget } = useRoundBudget(difficulty);
  const markedCount = useEvidenceCount(markedPacketIds);
  const visibleCount = roundPackets.length;
  const [roundHealth, setRoundHealth] = useState('ok'); // 'ok' | 'warn'
  const [packetCount, setPacketCount] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [tcpStreams, setTcpStreams] = useState({});
  const [roundPackets, setRoundPackets] = useState([]);
  const [groundTruth, setGroundTruth] = useState({ ids: [], reason: '', rubric: [] });
  const [showProtocolGuide, setShowProtocolGuide] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  const [showStudyPack, setShowStudyPack] = useState(false);
  
  // fileInputRef removed - no upload functionality
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState('beginner');

  const packets = roundPackets;

  // Load saved progress
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

  const handleNewRound = async () => {
    try {
      // Immediately set loading state so UI is stable
      setIsStreaming(false);
      setRoundPackets([]);           // clear previous packets
      setSelectedPacketId(null);     // clear selection
      setMarkedPacketIds([]);        // clear marks
      setGroundTruth({ ids: [], reason: '', rubric: [] });
      setRoundHealth('ok');

      // call scenario generator using difficulty-driven packet budgets
      const { packets: newPkts } = await newRound({ difficulty: level.charAt(0).toUpperCase() + level.slice(1), profile: scenarioId, buildScenario: async ({ template, totalPackets, evidencePackets }) => {
        // delegate to existing serverless/generator if present; otherwise return empty
        const { SCENARIOS } = await import('../lib/scenario-catalog');
        const scen = SCENARIOS[template] || SCENARIOS.mixed || Object.values(SCENARIOS)[0];
        if (scen && typeof scen.generate === 'function') {
          const r = scen.generate({ difficulty: level.charAt(0).toUpperCase() + level.slice(1), packetCount: totalPackets, evidenceCount: evidencePackets, seed: Date.now() });
          return { packets: r.packets || [], evidenceIds: r.groundTruth?.ids || [], briefing: r.groundTruth?.reason };
        }
        return { packets: [], evidenceIds: [], briefing: '' };
      }});

      // defensive check
      if (!Array.isArray(newPkts)) {
        console.error('createRound returned invalid packets:', newPkts);
        throw new Error('Invalid packet generation result');
      }

      // set UI state
      setRoundPackets(newPkts);
      // ground truth handled by Challenge engine; keep neutral here
      setIsStreaming(false);
      setRoundHealth('ok');

    } catch (err) {
      console.error('New round failed', err);
      // Show friendly non-blocking toast instead of full reload/alert
      toast('New Round failed. State was reset. Try again.');
      setIsStreaming(false);
      setRoundHealth('warn');
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
              
              {/* Round health dot */}
              <span aria-label={roundHealth === 'ok' ? 'Round healthy' : 'Round warning'} title={roundHealth === 'ok' ? 'Round healthy' : 'Issue occurred in last round'} className={`inline-block h-2 w-2 rounded-full ${roundHealth === 'ok' ? 'bg-green-500' : 'bg-amber-400'}`}></span>
              {/* Packet/Evidence pill */}
              <div className="px-3 py-1 rounded-md border border-zinc-700 text-zinc-200 font-mono text-[11px]">Packets: {visibleCount}/{budget} • Evidence marked: {markedCount}</div>

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

export async function getServerSideProps() {
  return { props: {} };
}
