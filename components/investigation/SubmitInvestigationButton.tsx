'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface SubmitInvestigationButtonProps {
  iocCount: number;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export default function SubmitInvestigationButton({
  iocCount,
  onSubmit,
  isSubmitting = false
}: SubmitInvestigationButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    if (iocCount === 0) return;
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onSubmit();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 max-w-md w-full mx-4"
        >
          <h3 className="text-xl font-bold text-white mb-2">Submit Investigation?</h3>
          <p className="text-gray-300 mb-4">
            You've tagged <span className="font-semibold text-[#58a6ff]">{iocCount}</span> IOCs.
            Untagged IOCs will be counted as unclassified.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded border border-[#30363d] text-gray-300 hover:text-white hover:bg-[#21262d] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 rounded bg-[#58a6ff] text-white font-medium hover:bg-[#4493f8] transition-colors"
            >
              Submit & Evaluate
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: iocCount > 0 ? 1.05 : 1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      disabled={iocCount === 0 || isSubmitting}
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
        iocCount === 0 || isSubmitting
          ? 'bg-[#21262d] text-gray-600 cursor-not-allowed border border-[#30363d]'
          : 'bg-green-600 text-white hover:bg-green-700 shadow-lg border border-green-500'
      }`}
      title={iocCount === 0 ? 'Tag at least one IOC first' : 'Submit your investigation'}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          <span>Evaluating...</span>
        </>
      ) : (
        <>
          <CheckCircle2 size={20} />
          <span>Submit Investigation</span>
          {iocCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-sm">
              {iocCount} IOCs Tagged
            </span>
          )}
        </>
      )}
      {iocCount > 0 && !isSubmitting && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}
    </motion.button>
  );
}

