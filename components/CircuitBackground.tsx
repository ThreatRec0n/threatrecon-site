"use client";
import React, { useEffect, useRef } from "react";

/**
 * Animated circuit-board style background.
 * Safe for SSR and strict TS: guards canvas/context, cancels RAF, and handles resize.
 */
export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return; // ref not mounted

    const ctx = canvas.getContext("2d");
    if (!ctx) return; // context not available

    const setSize = () => {
      const w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(w));
      canvas.height = Math.max(1, Math.floor(h));
    };
    setSize();

    let raf = 0;
    let tick = 0;

    const animate = () => {
      // Guard in case component unmounted between frames
      if (!canvasRef.current) return;
      // Clear with slight opacity for glow trail
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Simple moving nodes + links
      const cols = 14;
      const rows = 8;
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;

      // Grid glow
      ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
      ctx.lineWidth = 1;
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(Math.floor(c * cellW) + 0.5, 0);
        ctx.lineTo(Math.floor(c * cellW) + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, Math.floor(r * cellH) + 0.5);
        ctx.lineTo(canvas.width, Math.floor(r * cellH) + 0.5);
        ctx.stroke();
      }

      // Pulsing "packets"
      const pulses = 24;
      for (let i = 0; i < pulses; i++) {
        const x = ((i * 83 + tick * 2) % (canvas.width + 40)) - 20;
        const y = Math.sin((i * 17 + tick) * 0.05) * 10 + canvas.height * ((i % rows) / rows + 0.06);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(16, 185, 129, 0.9)";
        ctx.fill();
      }

      tick++;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      setSize();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}
