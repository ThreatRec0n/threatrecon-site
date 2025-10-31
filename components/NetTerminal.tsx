"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

type ExecFn = (cmd: string, args: string[]) => string;

export default function NetTerminal({ exec }:{ exec: ExecFn }) {
  const [lines, setLines] = useState<string[]>(["ThreatRecon Net CLI - type 'help'"]);
  const [buf, setBuf] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = buf.trim();
    if (!raw) return;
    const [cmd, ...args] = raw.split(/\s+/);
    let out = "";
    if (cmd === "help") {
      out = "Commands: ping <ip>, traceroute <ip>, nslookup <name>, clear";
    } else if (cmd === "clear") {
      setLines([]);
      setBuf("");
      return;
    } else {
      try { out = exec(cmd, args); } catch (e:any) { out = `error: ${e.message||e}`; }
    }
    setLines(l => [...l, `> ${raw}`, out].slice(-300));
    setBuf("");
    inputRef.current?.focus();
  };

  return (
    <div className="rounded bg-black/90 backdrop-blur-sm border border-emerald-500/30 text-green-400 p-2 font-mono text-xs h-56 overflow-auto shadow-lg">
      <div className="space-y-1">
        {lines.map((l,i)=>(
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="whitespace-pre-wrap"
          >
            {l}
          </motion.div>
        ))}
      </div>
      <form onSubmit={run} className="mt-2 flex items-center gap-1">
        <span className="text-emerald-400">$</span>
        <input
          ref={inputRef}
          value={buf}
          onChange={e=>setBuf(e.target.value)}
          className="bg-transparent outline-none flex-1 text-green-400 placeholder-green-600"
          placeholder="ping 8.8.8.8"
        />
        <motion.div
          animate={{ opacity: buf.trim() ? 1 : 0.3 }}
          className="text-slate-500 text-[10px]"
        >
          Enter
        </motion.div>
      </form>
    </div>
  );
}

