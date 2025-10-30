"use client";
import React, { useState } from "react";
export default function HintPanel({ getHints }:{ getHints:()=>string[] }) {
  const [revealed, setRevealed] = useState<string[]>([]);
  const all = getHints();
  const canReveal = revealed.length < all.length;
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">Hints</div>
        <button disabled={!canReveal} onClick={()=>setRevealed(r=>[...r, all[r.length]])}
          className={`px-2 py-1 border rounded text-xs ${canReveal?"":"opacity-50 cursor-not-allowed"}`}>
          Reveal next hint
        </button>
      </div>
      <ul className="list-disc ml-5 mt-2 text-xs text-slate-600 space-y-1">
        {revealed.map((h,i)=><li key={i}>{h}</li>)}
      </ul>
    </div>
  );
}