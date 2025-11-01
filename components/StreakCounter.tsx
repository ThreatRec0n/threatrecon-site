"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StreakCounter({ streak }: { streak: number }) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevStreak, setPrevStreak] = useState(0);

  useEffect(() => {
    if (streak > prevStreak && streak > 0) {
      // Celebrate milestones
      if (streak % 5 === 0 && streak >= 5) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
      setPrevStreak(streak);
    }
  }, [streak, prevStreak]);

  if (streak === 0) return null;

  const getStreakColor = () => {
    if (streak >= 15) return "from-purple-500 to-pink-500";
    if (streak >= 10) return "from-red-500 to-orange-500";
    if (streak >= 5) return "from-yellow-500 to-orange-500";
    return "from-yellow-400 to-yellow-600";
  };

  const getBonus = () => {
    if (streak >= 15) return "🔥 MEGA";
    if (streak >= 10) return "🔥 STRONG";
    if (streak >= 5) return "🔥 HOT";
    return "";
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: streak > prevStreak ? [1, 1.1, 1] : 1 }}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r ${getStreakColor()} text-white text-xs font-bold shadow-lg border-2 border-white/30`}
      >
        <motion.span
          animate={{ rotate: streak > prevStreak ? [0, 20, -20, 0] : 0 }}
          transition={{ duration: 0.3 }}
          className="text-base"
        >
          🔥
        </motion.span>
        <span>{streak} {getBonus()}</span>
      </motion.div>
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0 }}
            className="fixed top-20 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-2xl font-bold text-sm"
          >
            🎉 {streak} STREAK BONUS! 🎉
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

