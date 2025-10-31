"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Keep the 'escape' phase present to match the union used throughout.
export type StoryPhase = "intro" | "desperate" | "critical" | "escape";

interface EscapeStoryProps {
  oxygenLevel: number;
  onEscape: () => void;
  isConnected: boolean;
}

const messages: Record<StoryPhase, string[]> = {
  intro: [
    "You wake up disoriented, head throbbing. The room is dim, illuminated only by the faint glow of a computer screen.",
    "You're trapped. The door won't budge. Panic sets in as you realize the air feels... thin.",
    "On the desk, you find a note: 'The door will unlock when the network connects to the outside world. You have limited time.'",
    "The oxygen reading on the wall shows: **REDACTED**%. You need to work fast.",
  ],
  desperate: [
    "Your breathing is getting harder. The oxygen is running low.",
    "The computer shows a network topology. You remember your networking courses... or was that just a dream?",
    "Focus. Configure the static IPs correctly. Set up the firewall rules. Enable NAT.",
    "Every mistake costs you precious air.",
  ],
  critical: [
    "**GASP** The air is thin. Your vision blurs slightly.",
    "This is your last chance. The network must connect. NOW.",
    "Check each configuration carefully. One wrong IP address, one missed firewall rule...",
    "The door mechanism hums quietly, waiting for the signal.",
  ],
  escape: [
    "Connection established. The latch disengages.",
    "You exhale. The door opens. Session archived.",
  ],
};

export default function EscapeStory({ oxygenLevel, onEscape, isConnected }: EscapeStoryProps) {
  const [phase, setPhase] = useState<StoryPhase>("intro");
  const [showJournal, setShowJournal] = useState(true);

  useEffect(() => {
    if (oxygenLevel < 30) setPhase("critical");
    else if (oxygenLevel < 50) setPhase("desperate");
    else setPhase("intro");
  }, [oxygenLevel]);

  useEffect(() => {
    if (isConnected) {
      setPhase("escape");
      setTimeout(() => {
        onEscape();
      }, 2000);
    }
  }, [isConnected, onEscape]);

  if (isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-slate-900 border-2 border-emerald-500 rounded-xl p-8 max-w-md text-center"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-6xl mb-4"
          >
            🔓
          </motion.div>
          <h2 className="text-2xl font-bold text-emerald-400 mb-4">Connection Established!</h2>
          <p className="text-slate-300 mb-6">
            The network signal reaches the outside world. The door mechanism whirs to life.
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-xl text-white font-semibold"
          >
            You're free!
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {showJournal && (
        <motion.div
          initial={{ x: -400 }}
          animate={{ x: 0 }}
          exit={{ x: -400 }}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-80 bg-slate-900/95 backdrop-blur border-r border-slate-700 p-4 text-sm text-slate-300 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white">📖 Your Journal</h3>
            <button
              onClick={() => setShowJournal(false)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3 text-xs leading-relaxed">
            {(messages[phase] ?? []).map((msg, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                className="italic"
              >
                {msg}
              </motion.p>
            ))}
          </div>
          <button
            onClick={() => setShowJournal(false)}
            className="mt-4 w-full px-3 py-1 bg-slate-800 rounded text-xs hover:bg-slate-700"
          >
            Close Journal
          </button>
        </motion.div>
      )}
      {!showJournal && (
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => setShowJournal(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-8 h-20 bg-slate-900/90 border-r border-y border-slate-700 rounded-r flex items-center justify-center text-white hover:bg-slate-800"
        >
          📖
        </motion.button>
      )}
    </AnimatePresence>
  );
}
