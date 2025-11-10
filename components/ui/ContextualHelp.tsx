'use client';

import { useState, ReactNode } from 'react';

interface TooltipProps {
  content: string;
  title?: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Contextual Help Tooltip Component
 * Provides helpful information when hovering over UI elements
 */
export function Tooltip({ content, title, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 w-64 p-3 bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl text-sm text-[#c9d1d9] ${positionClasses[position]}`}
          role="tooltip"
        >
          {title && (
            <div className="font-semibold text-[#58a6ff] mb-1">{title}</div>
          )}
          <div>{content}</div>
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-[#161b22] border-[#30363d] ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-r border-b rotate-45' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-l border-t rotate-45' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-r border-t rotate-45' :
              'right-full top-1/2 -translate-y-1/2 border-l border-b rotate-45'
            }`}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Info Icon with Tooltip
 */
export function InfoIcon({ content, title }: { content: string; title?: string }) {
  return (
    <Tooltip content={content} title={title}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#30363d] text-[#8b949e] hover:bg-[#58a6ff] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
        aria-label="More information"
      >
        <span className="text-xs">?</span>
      </button>
    </Tooltip>
  );
}

/**
 * Help Link Component
 * "What does this mean?" links for technical terms
 */
export function HelpLink({ term, explanation }: { term: string; explanation: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[#58a6ff] hover:text-[#79c0ff] underline text-xs ml-1"
        aria-label={`Learn more about ${term}`}
      >
        What does this mean?
      </button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-[#161b22] border border-[#30363d] rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#c9d1d9]">{term}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[#8b949e] hover:text-[#c9d1d9] text-xl"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-[#c9d1d9] leading-relaxed">{explanation}</p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Help Sidebar Component
 * Toggleable sidebar with searchable help documentation
 */
interface HelpSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpSidebar({ isOpen, onClose }: HelpSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const helpTopics = [
    {
      category: 'IOC Types',
      items: [
        {
          term: 'IP Address',
          explanation: 'An Internet Protocol address is a numerical label assigned to each device connected to a computer network. In threat hunting, suspicious IPs often indicate command and control (C2) servers or data exfiltration endpoints.',
        },
        {
          term: 'Domain Name',
          explanation: 'A domain name is a human-readable address for websites. Malicious domains are often used for phishing, malware distribution, or C2 communication. Check domains against threat intelligence feeds.',
        },
        {
          term: 'File Hash',
          explanation: 'A cryptographic hash (MD5, SHA1, SHA256) uniquely identifies a file. Malicious file hashes are often shared in threat intelligence to help identify known malware samples.',
        },
        {
          term: 'Process ID (PID)',
          explanation: 'A Process ID is a unique identifier for a running process. Tracking PIDs helps correlate process creation events and understand process trees in an attack chain.',
        },
      ],
    },
    {
      category: 'MITRE ATT&CK',
      items: [
        {
          term: 'Initial Access',
          explanation: 'The initial access tactic represents the methods attackers use to gain entry into a network, such as phishing, drive-by compromise, or exploitation of public-facing applications.',
        },
        {
          term: 'Execution',
          explanation: 'The execution tactic consists of techniques that result in adversary-controlled code running on a local or remote system, such as command-line interfaces, scripts, or service execution.',
        },
        {
          term: 'Persistence',
          explanation: 'Persistence techniques allow attackers to maintain access to systems across restarts, changed credentials, and other interruptions, such as scheduled tasks, boot or logon autostart execution.',
        },
        {
          term: 'Lateral Movement',
          explanation: 'Lateral movement consists of techniques that enable an attacker to access and control remote systems on a network, such as remote services, SMB/Windows Admin Shares, or Taint Shared Content.',
        },
      ],
    },
    {
      category: 'Investigation Workflow',
      items: [
        {
          term: 'Log Analysis',
          explanation: 'The process of examining log files to identify patterns, anomalies, or indicators of compromise. Effective log analysis requires understanding normal vs. abnormal behavior.',
        },
        {
          term: 'Threat Intelligence',
          explanation: 'Information about threats and threat actors that helps identify, assess, and respond to security incidents. OSINT (Open Source Intelligence) tools provide publicly available threat data.',
        },
        {
          term: 'IOC Tagging',
          explanation: 'The process of categorizing Indicators of Compromise as confirmed threats, suspicious, or benign based on evidence and threat intelligence. Accurate tagging is critical for effective incident response.',
        },
        {
          term: 'Attack Chain',
          explanation: 'A sequence of attack techniques used by adversaries to achieve their objectives. Understanding the full attack chain helps identify all compromised systems and the scope of an incident.',
        },
      ],
    },
  ];

  const filteredTopics = helpTopics.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-[#161b22] border-l border-[#30363d] w-full max-w-md overflow-y-auto">
        <div className="sticky top-0 bg-[#161b22] border-b border-[#30363d] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#c9d1d9]">Help & Documentation</h2>
            <button
              onClick={onClose}
              className="text-[#8b949e] hover:text-[#c9d1d9] text-xl"
              aria-label="Close help sidebar"
            >
              ✕
            </button>
          </div>
          <input
            type="search"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
          />
        </div>
        <div className="p-4 space-y-6">
          {filteredTopics.map((category, idx) => (
            <div key={idx}>
              <h3 className="text-lg font-semibold text-[#58a6ff] mb-3">{category.category}</h3>
              <div className="space-y-3">
                {category.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-[#c9d1d9] mb-2">{item.term}</h4>
                    <p className="text-sm text-[#8b949e] leading-relaxed">{item.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

