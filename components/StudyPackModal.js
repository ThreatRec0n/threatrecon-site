import React, { useState } from 'react';
import { WIRESHARK_STUDY_PACK } from '../lib/wireshark-study';

export default function StudyPackModal({ isOpen, onClose }) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const currentContent = WIRESHARK_STUDY_PACK[currentPage];

  const nextPage = () => {
    if (currentPage < WIRESHARK_STUDY_PACK.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-terminal-green font-mono">
            Wireshark Study Pack
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Page Navigation */}
        <div className="px-4 py-2 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 0}
                className="px-3 py-1 text-xs font-mono bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded border border-gray-600"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-400 font-mono">
                Page {currentPage + 1} of {WIRESHARK_STUDY_PACK.length}
              </span>
              <button
                onClick={nextPage}
                disabled={currentPage === WIRESHARK_STUDY_PACK.length - 1}
                className="px-3 py-1 text-xs font-mono bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-300 rounded border border-gray-600"
              >
                Next →
              </button>
            </div>
            
            {/* Page Jump */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">Jump to:</span>
              <select
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                className="bg-gray-800 border border-gray-600 text-gray-300 text-xs font-mono rounded px-2 py-1"
              >
                {WIRESHARK_STUDY_PACK.map((_, index) => (
                  <option key={index} value={index}>
                    Page {index + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-terminal-green font-mono mb-4">
              {currentContent.title}
            </h3>
            <div className="prose prose-invert max-w-none">
              <div className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-line">
                {currentContent.content}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400 font-mono">
              Use arrow keys to navigate • Press ESC to close
            </div>
            <div className="flex gap-2">
              {WIRESHARK_STUDY_PACK.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentPage 
                      ? 'bg-terminal-green' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={`Page ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
