"use client";
import React, { useEffect, useRef } from "react";

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Circuit board nodes and connections
    const nodes: Array<{ x: number; y: number; glow: number; pulse: number }> = [];
    const connections: Array<{ from: number; to: number; active: number }> = [];

    // Generate nodes
    for (let i = 0; i < 40; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        glow: Math.random(),
        pulse: Math.random() * Math.PI * 2
      });
    }

    // Generate connections between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && Math.random() > 0.7) {
          connections.push({ from: i, to: j, active: Math.random() });
        }
      }
    }

    let frame = 0;
    function animate() {
      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.fillRect(0, 0, width, height);

      frame += 0.01;

      // Draw connections
      connections.forEach(conn => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        const pulse = (Math.sin(frame * 2 + conn.active * 5) + 1) * 0.3 + 0.4;
        
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, `rgba(56, 189, 248, ${0.1 * pulse})`);
        gradient.addColorStop(1, `rgba(34, 211, 238, ${0.1 * pulse})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        node.pulse += 0.02;
        const glowIntensity = (Math.sin(node.pulse) + 1) * 0.3 + 0.2;
        const size = 2 + glowIntensity * 2;

        // Outer glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 4);
        gradient.addColorStop(0, `rgba(56, 189, 248, ${0.6 * glowIntensity})`);
        gradient.addColorStop(0.5, `rgba(34, 211, 238, ${0.3 * glowIntensity})`);
        gradient.addColorStop(1, "rgba(56, 189, 248, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = i % 10 === 0 ? "rgba(168, 85, 247, 0.8)" : "rgba(56, 189, 248, 0.9)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}
    />
  );
}

