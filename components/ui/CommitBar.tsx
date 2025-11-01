"use client";
import React from "react";

type Props = {
  committed: boolean;
  onCommit: () => void;
  disabled?: boolean;
  className?: string;
};

export default function CommitBar({ committed, onCommit, disabled, className }: Props) {
  return (
    <div className={`mt-1.5 flex items-center gap-1.5 ${className ?? ""}`}>
      <button
        type="button"
        onClick={onCommit}
        disabled={disabled}
        className="rounded-md bg-sky-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Commit
      </button>
      <span
        className={`ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[9px] ${
          committed
            ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200"
            : "bg-amber-50 text-amber-600 ring-1 ring-amber-200"
        }`}
      >
        {committed ? "✓" : "Pending"}
      </span>
    </div>
  );
}


