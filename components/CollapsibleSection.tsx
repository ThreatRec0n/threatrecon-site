"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  className = ""
}: { 
  title: string; 
  icon?: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <div className={`border rounded-lg bg-white/90 shadow-sm ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon && <span>{icon}</span>}
          <span>{title}</span>
        </div>
        <span className="text-slate-500 text-xs">{open ? "▼" : "▶"}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-2 pt-0 border-t">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

