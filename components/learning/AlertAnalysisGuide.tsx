'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap } from 'lucide-react';
import type { Alert } from '@/lib/simulation-engine/core-types';

interface AlertAnalysisGuideProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertAnalysisGuide({ alert, isOpen, onClose }: AlertAnalysisGuideProps) {
  if (!alert || !isOpen) return null;

  // Determine guide content based on alert type
  const getGuideContent = () => {
    const title = alert.title.toLowerCase();
    const rule = alert.detection_rule.toLowerCase();

    if (title.includes('powershell') || rule.includes('powershell')) {
      return {
        title: 'PowerShell Execution Alert',
        keyQuestions: [
          'Is the command encoded or obfuscated?',
          'What process launched PowerShell?',
          'Did it make network connections?',
          'Were files created or modified?',
          'Is this normal for this user/system?'
        ],
        checklist: [
          'Review command line arguments',
          'Check parent process',
          'Look for network activity within 5 minutes',
          'Verify user account permissions',
          'Search for similar activity on other hosts'
        ]
      };
    }

    if (title.includes('lateral') || title.includes('smb') || rule.includes('lateral')) {
      return {
        title: 'Lateral Movement Alert',
        keyQuestions: [
          'Are SMB connections to multiple hosts?',
          'Was there recent privilege escalation?',
          'Is this normal for this user?',
          'What account is being used?',
          'Are connections happening during business hours?'
        ],
        checklist: [
          'Check source and destination systems',
          'Verify account permissions',
          'Review timing (business hours vs off-hours)',
          'Look for privilege escalation before movement',
          'Map the lateral movement path'
        ]
      };
    }

    if (title.includes('exfil') || title.includes('transfer') || rule.includes('exfil')) {
      return {
        title: 'Data Exfiltration Alert',
        keyQuestions: [
          'How much data was transferred?',
          'Where did it go (IP/domain)?',
          'What protocol was used?',
          'Was the data encrypted?',
          'Is this destination expected?'
        ],
        checklist: [
          'Calculate data transfer volume',
          'Check destination IP/domain reputation',
          'Review protocol used (HTTPS, FTP, etc.)',
          'Verify if data was encrypted',
          'Check for similar transfers to same destination'
        ]
      };
    }

    if (title.includes('credential') || title.includes('mimikatz') || rule.includes('credential')) {
      return {
        title: 'Credential Dumping Alert',
        keyQuestions: [
          'What accessed LSASS?',
          'Was Mimikatz or similar tool used?',
          'Are there new scheduled tasks?',
          'Has lateral movement occurred?',
          'Were passwords found in memory?'
        ],
        checklist: [
          'Identify process that accessed LSASS',
          'Review command line for Mimikatz indicators',
          'Check for new services or scheduled tasks',
          'Audit recent account logins',
          'Review Active Directory replication logs'
        ]
      };
    }

    // Default guide
    return {
      title: 'General Alert Analysis',
      keyQuestions: [
        'What triggered this alert?',
        'Is this behavior normal?',
        'What systems are affected?',
        'What is the potential impact?',
        'What should I do next?'
      ],
      checklist: [
        'Review alert details and context',
        'Check affected systems',
        'Look for related events',
        'Assess potential impact',
        'Determine appropriate response'
      ]
    };
  };

  const content = getGuideContent();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9996] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-[#58a6ff]" size={20} />
              <h2 className="text-xl font-bold text-white">🎓 How to Analyze This Alert</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">{content.title}</h3>
            </div>

            {/* Key Questions */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Key Questions to Ask:</h4>
              <ul className="space-y-2">
                {content.keyQuestions.map((question, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-[#58a6ff] mt-0.5">✓</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Investigation Checklist */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Investigation Checklist:</h4>
              <ul className="space-y-2">
                {content.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-gray-500 mt-0.5">□</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-[#161b22] border-t border-[#30363d] p-4 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded border border-[#30363d] text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
            >
              Got It
            </button>
            <button
              onClick={() => {
                // Show guide for all alerts
                onClose();
              }}
              className="px-4 py-2 rounded bg-[#58a6ff] text-white font-medium hover:bg-[#4493f8] transition-colors"
            >
              Show Guide for All Alerts
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

