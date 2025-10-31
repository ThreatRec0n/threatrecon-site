"use client";
import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(()=>{
    document.documentElement.classList.toggle('dark', dark);
  },[dark]);
  return (
    <button onClick={()=>setDark(d=>!d)} className="px-2 py-1 rounded border text-xs">
      {dark?"Dark":"Light"}
    </button>
  );
}


