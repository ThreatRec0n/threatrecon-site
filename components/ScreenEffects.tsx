"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function ScreenEffects({ 
  shake, 
  flash, 
  glow 
}: { 
  shake?: boolean; 
  flash?: "error" | "success"; 
  glow?: boolean;
}) {
  return (
    <>
      {shake && (
        <motion.div
          animate={{ x: [0, -5, 5, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-none z-[55]"
        />
      )}
      {flash === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-red-500 pointer-events-none z-[55]"
        />
      )}
      {flash === "success" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-emerald-500 pointer-events-none z-[55]"
        />
      )}
      {glow && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="fixed inset-0 bg-emerald-400/20 pointer-events-none z-[54]"
        />
      )}
    </>
  );
}

