"use client";
import React, { useEffect, useState } from "react";
export default function MissionTimer({ minutes=15, onExpire }:{ minutes?:number; onExpire:()=>void }) {
  const [end] = useState(()=>Date.now()+minutes*60*1000);
  const [now, setNow] = useState(Date.now());
  useEffect(()=>{
    const t = setInterval(()=>setNow(Date.now()), 1000);
    return ()=>clearInterval(t);
  },[]);
  const remain = Math.max(0, end - now);
  const mm = String(Math.floor(remain/60000)).padStart(2,"0");
  const ss = String(Math.floor((remain%60000)/1000)).padStart(2,"0");
  useEffect(()=>{
    if(remain === 0) onExpire();
  },[remain,onExpire]);
  return <div className="px-3 py-1 rounded bg-slate-900 text-white text-xs font-mono select-none">â± {mm}:{ss}</div>;
}