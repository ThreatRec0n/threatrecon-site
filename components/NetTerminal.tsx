"use client";
import React, { useRef, useState } from "react";

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
    <div className="rounded bg-black text-green-400 p-2 font-mono text-xs h-56 overflow-auto">
      {lines.map((l,i)=><div key={i} className="whitespace-pre-wrap">{l}</div>)}
      <form onSubmit={run} className="mt-2">
        <span className="text-slate-400">$ </span>
        <input ref={inputRef} value={buf} onChange={e=>setBuf(e.target.value)}
          className="bg-black outline-none w-[90%]" placeholder="ping 8.8.8.8" />
      </form>
    </div>
  );
}

