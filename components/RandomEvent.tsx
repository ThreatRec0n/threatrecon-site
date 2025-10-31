"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Event = { id: string; msg: string; severity: "low"|"high" };

export default function RandomEvent({ enabled, onEvent }: { enabled: boolean; onEvent: (e: Event)=>void }) {
  const [active, setActive] = useState<Event | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.15) { // 15% chance every check
        const events: Event[] = [
          { id: "1", msg: "⚠️ Network interface glitch detected!", severity: "low" },
          { id: "2", msg: "🚨 Critical: Firewall rules may be reset!", severity: "high" },
          { id: "3", msg: "⚡ Power fluctuation... connections unstable", severity: "low" },
        ];
        const e = events[Math.floor(Math.random() * events.length)];
        setActive(e);
        onEvent(e);
        setTimeout(() => setActive(null), 4000);
      }
    }, 8000); // Check every 8 seconds
    return () => clearInterval(interval);
  }, [enabled, onEvent]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-xl ${
            active.severity === "high" ? "bg-red-600 text-white" : "bg-yellow-500 text-white"
          }`}
        >
          <div className="font-semibold text-sm">{active.msg}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

