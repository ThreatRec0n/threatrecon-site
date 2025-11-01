"use client";
import React from "react";
import { motion } from "framer-motion";

type Report = {
  timeSpent: number;
  errors: number;
  commits: number;
  pings: number;
  success: boolean;
  achievements: string[];
};

export default function PostGameReport({ report, onClose }: { report: Report; onClose: ()=>void }) {
  const efficiency = report.timeSpent > 0 ? Math.round((report.commits / report.timeSpent) * 60) : 0;
  const accuracy = report.commits > 0 ? Math.round((1 - report.errors / report.commits) * 100) : 100;
  const grade = accuracy >= 90 ? "A" : accuracy >= 80 ? "B" : accuracy >= 70 ? "C" : accuracy >= 60 ? "D" : "F";
  
  const timeMinutes = Math.floor(report.timeSpent / 60);
  const timeSeconds = report.timeSpent % 60;
  const timeDisplay = `${timeMinutes}:${timeSeconds.toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-2xl rounded-xl border bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">📊 Post-Game Report</h2>
            <button onClick={onClose} className="text-white hover:text-red-300 text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-white/20 transition">✕</button>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
              <div className="text-xs text-slate-600 mb-1">Time Spent</div>
              <div className="text-2xl font-bold text-blue-700">{timeDisplay}</div>
            </div>
            <div className={`p-4 rounded-lg border-2 ${report.errors === 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
              <div className="text-xs text-slate-600 mb-1">Errors</div>
              <div className={`text-2xl font-bold ${report.errors === 0 ? "text-emerald-700" : "text-red-700"}`}>{report.errors}</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
              <div className="text-xs text-slate-600 mb-1">Commits</div>
              <div className="text-2xl font-bold text-purple-700">{report.commits}</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
              <div className="text-xs text-slate-600 mb-1">Tests</div>
              <div className="text-2xl font-bold text-orange-700">{report.pings}</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-slate-50">
              <div className="text-sm font-semibold mb-2">Accuracy Score</div>
              <div className="flex items-baseline gap-2">
                <div className={`text-4xl font-bold ${accuracy >= 90 ? "text-emerald-600" : accuracy >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {accuracy}%
                </div>
                <div className={`text-2xl font-bold ${accuracy >= 90 ? "text-emerald-600" : accuracy >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                  {grade}
                </div>
              </div>
              <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${accuracy >= 90 ? "bg-emerald-500" : accuracy >= 70 ? "bg-yellow-500" : "bg-red-500"} transition-all`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-slate-50">
              <div className="text-sm font-semibold mb-2">Efficiency</div>
              <div className="text-4xl font-bold text-blue-600">{efficiency}</div>
              <div className="text-xs text-slate-500 mt-1">commits per minute</div>
            </div>
          </div>

          {/* Achievements */}
          {report.achievements.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span>🏆</span>
                <span>Achievements Earned ({report.achievements.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {report.achievements.map(a => (
                  <motion.span
                    key={a}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 text-xs font-semibold shadow-sm"
                  >
                    🏆 {a}
                  </motion.span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className={`p-4 rounded-lg border-2 ${report.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
            <div className="font-semibold mb-2 flex items-center gap-2">
              {report.success ? "✅" : "❌"}
              <span>{report.success ? "Mission Complete!" : "Mission Failed"}</span>
            </div>
            <div className="text-sm text-slate-700 mt-2">
              {report.success ? (
                <div>
                  <p className="mb-2">🎉 Congratulations! You successfully configured the network and established connectivity!</p>
                  {report.errors === 0 && <p>✨ Perfect run with zero errors!</p>}
                  {efficiency > 5 && <p>⚡ Excellent efficiency - you configured quickly!</p>}
                </div>
              ) : (
                <div>
                  <p className="mb-2">💡 Don't give up! Review your configuration and try again.</p>
                  {report.errors > 0 && <p>⚠️ Focus on reducing errors - check subnet masks and gateways carefully.</p>}
                  <p>📚 Use the Subnet Calculator and Common Mistakes guide for help.</p>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-full px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-lg font-semibold hover:from-slate-800 hover:to-slate-600 transition shadow-lg"
          >
            Close Report
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

