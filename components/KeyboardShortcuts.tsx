"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const shortcuts = [
  { key: "Ctrl+Enter", action: "Commit all devices" },
  { key: "Tab", action: "Navigate between fields" },
  { key: "Esc", action: "Close modals" },
  { key: "H", action: "Toggle help overlay" },
  { key: "P", action: "Toggle practice mode" },
];

export default function KeyboardShortcuts({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-16 right-4 z-50 bg-white rounded-lg shadow-xl border p-4 max-w-xs"
    >
      <h3 className="font-bold mb-2 text-sm">Keyboard Shortcuts</h3>
      <div className="space-y-1 text-xs">
        {shortcuts.map(s => (
          <div key={s.key} className="flex justify-between">
            <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono text-[10px]">{s.key}</kbd>
            <span className="text-slate-600">{s.action}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

