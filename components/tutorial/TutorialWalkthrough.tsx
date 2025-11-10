'use client';

import { useState, useEffect, useRef } from 'react';

interface TutorialStep {
  id: number;
  title: string;
  explanation: string;
  goal: string;
  highlightSelector?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  currentPage: 'landing' | 'simulation';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to SOC Investigation",
    explanation: `Every simulation begins with a brief description of a possible cyberattack. Read it carefully — it sets the stage. You'll find out what type of threat you're dealing with: ransomware, insider sabotage, phishing, or something more advanced. This is your incident briefing, like what a real SOC analyst might get when responding to an alert.`,
    goal: "Form an initial hypothesis — what kind of activity might you expect to see in the logs?",
    highlightSelector: '[data-tutorial="scenario-intro"]',
    position: 'center',
  },
  {
    id: 2,
    title: "Explore the Log Explorer",
    explanation: `This is your main investigation surface. It contains raw system logs from tools like Sysmon, Zeek, Suricata, and more. These logs show things like network connections, process execution, and file changes. Use the search and filter features to narrow down events by time, source, or keywords.`,
    goal: "Look for anything abnormal — suspicious process names (e.g., powershell, cmd, encoded commands), unusual parent-child process relationships, IP connections to strange domains, or user accounts doing strange things at strange times. This is how you identify potential Indicators of Compromise (IOCs).",
    highlightSelector: '[data-tutorial="log-explorer"]',
    position: 'center',
  },
  {
    id: 3,
    title: "Tag and Investigate IOCs",
    explanation: `Found a suspicious IP, domain, hash, or process ID? Use the IOC Tagging Panel to categorize them. You can mark IOCs as 'Confirmed Threat', 'Suspicious', or 'Benign'. Don't just guess — use built-in OSINT tools (like VirusTotal, OTX, AbuseIPDB) to validate your findings. These tools tell you whether an IOC has been reported by other security professionals around the world.`,
    goal: "Click on an IP/domain/hash in the logs, use the enrichment panel to check its reputation, and look at indicators like malicious reports, last seen, first submission. Confirm whether something is benign or malicious based on open intelligence, then tag it appropriately.",
    highlightSelector: '[data-tutorial="ioc-panel"]',
    position: 'right',
  },
  {
    id: 4,
    title: "Map to MITRE ATT&CK",
    explanation: `Now that you've found suspicious activity, ask: What technique was used? Use the built-in MITRE ATT&CK Navigator to map the behavior you saw in the logs to real-world attacker techniques. Understanding the attack chain helps you understand the full scope of the incident.`,
    goal: "Understand how adversaries operate and how this activity fits into a known attack pattern. Examples: Was there a Scheduled Task created? → That's 'Persistence: Scheduled Task/Job'. Was PowerShell used to download a payload? → That's 'Execution: Scripting'.",
    highlightSelector: '[data-tutorial="mitre-navigator"]',
    position: 'center',
  },
  {
    id: 5,
    title: "Document Your Findings",
    explanation: `As you investigate, use the Case Notes feature to document your findings. Take screenshots, attach evidence, and write summaries. This helps you build a complete picture of the incident and is essential for creating your final report.`,
    goal: "Practice documenting your investigation like a real analyst. Use the Case Notes tab to record what you find, when you found it, and why it's significant.",
    highlightSelector: '[data-tutorial="case-notes"]',
    position: 'right',
  },
  {
    id: 6,
    title: "Finalize Your Investigation",
    explanation: `When you're ready, finalize the investigation. You'll receive a comprehensive score and detailed feedback — but more importantly, you'll learn what you missed and how you did. This is how real SOC analysts sharpen their skills. The evaluation report shows you which IOCs you correctly identified and which ones you missed.`,
    goal: "Submit your findings, get your skill badge, and try again with a different scenario or higher difficulty. Use the 'Finalize Investigation' button when you've tagged all suspicious IOCs and documented your findings.",
    highlightSelector: '[data-tutorial="finalize-button"]',
    position: 'top',
  },
];

export default function TutorialWalkthrough({ isOpen, onClose, onComplete, currentPage }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setShowIntro(true);
      setHighlightedElement(null);
      return;
    }

    if (showIntro) return;

    // Find and highlight the element for current step
    const step = TUTORIAL_STEPS[currentStep];
    if (step?.highlightSelector) {
      const element = document.querySelector(step.highlightSelector) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }
  }, [isOpen, currentStep, showIntro]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleNext = () => {
    if (showIntro) {
      setShowIntro(false);
      setCurrentStep(0);
    } else if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('walkthrough_seen_v1', 'true');
    onClose();
  };

  const handleComplete = () => {
    localStorage.setItem('walkthrough_seen_v1', 'true');
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = TUTORIAL_STEPS[currentStep];

  // Calculate highlight position if element exists
  const highlightStyle: React.CSSProperties = highlightedElement
    ? (() => {
        const rect = highlightedElement.getBoundingClientRect();
        return {
          position: 'fixed',
          top: `${rect.top}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          pointerEvents: 'none',
        };
      })()
    : {};

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
    >
      {/* Dimmed background */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Highlight overlay (cutout for highlighted element) */}
      {highlightedElement && (
        <div
          className="absolute border-4 border-[#58a6ff] rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.8)] pointer-events-none"
          style={highlightStyle}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-[#58a6ff] rounded-full animate-pulse" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#58a6ff] rounded-full animate-pulse" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#58a6ff] rounded-full animate-pulse" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#58a6ff] rounded-full animate-pulse" />
        </div>
      )}

      {/* Tutorial Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`bg-[#161b22] border-2 border-[#58a6ff] rounded-xl shadow-2xl max-w-2xl w-full p-8 pointer-events-auto ${
            currentStepData?.position === 'top' ? 'self-start mt-20' :
            currentStepData?.position === 'bottom' ? 'self-end mb-20' :
            currentStepData?.position === 'left' ? 'self-center mr-auto ml-20' :
            currentStepData?.position === 'right' ? 'self-center ml-auto mr-20' :
            'self-center'
          }`}
        >
          {showIntro ? (
            <>
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎓</div>
                <h2 id="tutorial-title" className="text-3xl font-bold text-[#c9d1d9] mb-4">
                  Welcome to Threat Hunt Lab!
                </h2>
                <p className="text-lg text-[#8b949e] leading-relaxed">
                  This walkthrough will teach you how to investigate cyber threats like a SOC analyst — no experience needed.
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-[#58a6ff] mb-2">What You'll Learn:</h3>
                  <ul className="space-y-2 text-sm text-[#c9d1d9]">
                    <li>• How to read and analyze security logs</li>
                    <li>• How to identify Indicators of Compromise (IOCs)</li>
                    <li>• How to use OSINT tools for threat intelligence</li>
                    <li>• How to map attacks to MITRE ATT&CK framework</li>
                    <li>• How to finalize and report your investigation</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-[#58a6ff] text-white rounded-lg hover:bg-[#4493f8] transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    Start Walkthrough
                  </button>
                  <button
                    onClick={handleSkip}
                    className="px-6 py-3 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-lg hover:border-[#58a6ff] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    Skip Tutorial
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#58a6ff]">
                    Step {currentStep + 1} of {TUTORIAL_STEPS.length}
                  </span>
                  <div className="flex gap-1">
                    {TUTORIAL_STEPS.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 w-8 rounded ${
                          idx <= currentStep ? 'bg-[#58a6ff]' : 'bg-[#30363d]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-[#8b949e] hover:text-[#c9d1d9] text-xl focus:outline-none focus:ring-2 focus:ring-[#58a6ff] rounded p-1"
                  aria-label="Close tutorial"
                >
                  ✕
                </button>
              </div>

              {/* Step Content */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[#c9d1d9] mb-4">
                    {currentStepData.title}
                  </h2>
                  <div className="space-y-4 text-[#c9d1d9] leading-relaxed">
                    <p className="text-base">{currentStepData.explanation}</p>
                    <div className="bg-[#0d1117] border-l-4 border-[#58a6ff] pl-4 py-3 rounded">
                      <p className="text-sm font-semibold text-[#58a6ff] mb-1">🎯 Your Goal:</p>
                      <p className="text-sm">{currentStepData.goal}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-[#30363d]">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="px-4 py-2 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded hover:border-[#58a6ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                  >
                    ← Previous
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded hover:border-[#58a6ff] transition-colors focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                    >
                      Skip Tutorial
                    </button>
                    <button
                      onClick={handleNext}
                      className="px-6 py-2 bg-[#58a6ff] text-white rounded hover:bg-[#4493f8] transition-colors font-semibold focus:outline-none focus:ring-2 focus:ring-[#58a6ff]"
                    >
                      {currentStep === TUTORIAL_STEPS.length - 1 ? 'Complete' : 'Next →'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

