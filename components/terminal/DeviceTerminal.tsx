"use client";

import React, {useRef, useState} from "react";

export type TerminalCmd = "ping"|"traceroute"|"help"|"clear";

export type TerminalSource = { kind:"dmz"|"lan"|"fw"|"wan"; id:string }; // id: node key shown in diagram

export type ExecFn = (src: TerminalSource, cmd: TerminalCmd, args: string[]) => Promise<string[]>;

export default function DeviceTerminal({
  source,
  onExec
}:{
  source: TerminalSource;
  onExec: ExecFn;
}) {
  const [lines,setLines] = useState<string[]>([
    `source: ${source.kind}:${source.id}`,
    `type 'help' for commands.`
  ]);
  const [input,setInput] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const run = async () => {
    const raw = input.trim();
    if(!raw) return;
    setLines(l=>[...l, `> ${raw}`]);
    setInput("");
    const [cmd, ...rest] = raw.split(/\s+/);
    const map: Record<string, TerminalCmd> = { ping:"ping", traceroute:"traceroute", trace:"traceroute", help:"help", clear:"clear" };
    const c = map[cmd?.toLowerCase()];
    if(!c){ setLines(l=>[...l, `unknown: ${cmd}. try 'help'`]); return; }
    if(c==="clear"){ setLines([]); return; }
    if(c==="help"){
      setLines(l=>[...l, "commands:", "  ping <ip|host>", "  traceroute <ip|host>", "  clear"]);
      return;
    }
    const out = await onExec(source, c, rest);
    setLines(l=>[...l, ...out]);
  };

  return (
    <div className="rounded-xl border bg-slate-950 text-slate-100">
      <div className="px-3 py-2 text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-800">
        Terminal — {source.kind}:{source.id}
      </div>
      <div className="p-3 h-40 overflow-y-auto text-xs font-mono space-y-1">
        {lines.map((ln,i)=><div key={i}>{ln}</div>)}
      </div>
      <div className="flex items-center gap-2 p-2 border-t border-slate-800">
        <input
          ref={ref}
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") run(); }}
          placeholder="ping 8.8.8.8"
          className="flex-1 bg-slate-900 rounded-md px-3 py-2 outline-none"
        />
        <button onClick={run} className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600">Run</button>
      </div>
    </div>
  );
}

