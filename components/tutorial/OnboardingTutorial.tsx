'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

interface TutorialStep {
  id: number;
  title: string;
  message: string;
  highlightSelector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Welcome to ThreatRecon SOC Platform',
    message: "You're about to investigate your first security incident. Let's learn the basics.",
    position: 'center'
  },
  {
    id: 2,
    title: 'Alert Queue - Your Mission Critical Tasks',
    message: 'These are security alerts from your SIEM. Red badges = Critical (investigate immediately), Orange = High, Yellow = Medium, Blue = Low. Higher severity requires faster response time (SLA).',
    highlightSelector: '[data-tutorial="alert-queue"]',
    position: 'right'
  },
  {
    id: 3,
    title: 'Your First Critical Alert',
    message: 'Click the Critical severity alert (INC-2024-100002) to view details. In a real SOC, Critical alerts get investigated within 15 minutes.',
    highlightSelector: '[data-tutorial="first-alert"]',
    position: 'right'
  },
  {
    id: 4,
    title: 'Event Log Explorer - Finding Needles in Haystacks',
    message: '3000+ events from Sysmon, Zeek, Suricata, and EDR sensors. Your job: find the malicious activity hidden in all this legitimate noise. This is what real SOC analysts face every day.',
    highlightSelector: '[data-tutorial="log-explorer"]',
    position: 'left'
  },
  {
    id: 5,
    title: 'IOC Tagging - Document Your Findings',
    message: 'Tag Indicators of Compromise (IOCs) as:\n• Red X = Confirmed Threat\n• Yellow ? = Suspicious\n• Green ✓ = Benign/False Positive\n\nThis is how you document your investigation for other analysts and incident responders.',
    highlightSelector: '[data-tutorial="ioc-panel"]',
    position: 'left'
  },
  {
    id: 6,
    title: 'SLA Timers - Time is Critical',
    message: 'Each alert has a Service Level Agreement (SLA) deadline:\n• Critical: 15 minutes\n• High: 1 hour\n• Medium: 4 hours\n• Low: 24 hours\n\nMiss the deadline = SLA breach (happens in real SOCs too).',
    highlightSelector: '[data-tutorial="sla-timer"]',
    position: 'right'
  },
  {
    id: 7,
    title: 'Ready to Investigate',
    message: 'Remember:\n• Look for patterns across events\n• Trust the data, not assumptions\n• Don\'t be afraid to mark things as suspicious if unsure\n• Real SOC analysts make mistakes too - that\'s why we learn\n\n[Start Investigation] when ready!',
    position: 'center'
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTutorial({ onComplete, onSkip }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const step = TUTORIAL_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  // Load saved progress
  useEffect(() => {
    const savedStep = localStorage.getItem('threatrecon_tutorial_step');
    if (savedStep) {
      const stepNum = parseInt(savedStep, 10);
      if (stepNum < TUTORIAL_STEPS.length) {
        setCurrentStep(stepNum);
      }
    }
  }, []);

  // Find and highlight element
  useEffect(() => {
    if (step.highlightSelector) {
      const element = document.querySelector(step.highlightSelector) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }
  }, [currentStep, step.highlightSelector]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      localStorage.setItem('threatrecon_tutorial_step', nextStep.toString());
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      localStorage.setItem('threatrecon_tutorial_step', prevStep.toString());
    }
  };

  const handleComplete = () => {
    localStorage.setItem('threatrecon_tutorial_completed', 'true');
    localStorage.removeItem('threatrecon_tutorial_step');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('threatrecon_tutorial_completed', 'true');
    localStorage.removeItem('threatrecon_tutorial_step');
    onSkip();
  };

  // Calculate spotlight position
  const getSpotlightPosition = () => {
    if (!highlightedElement) return { top: '50%', left: '50%', width: '100%', height: '100%' };

    const rect = highlightedElement.getBoundingClientRect();
    return {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    };
  };

  const spotlightPos = getSpotlightPosition();

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-auto"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

        {/* Spotlight effect */}
        {highlightedElement && (
          <motion.div
            className="absolute border-4 border-[#58a6ff] rounded-lg pointer-events-none"
            style={{
              top: spotlightPos.top,
              left: spotlightPos.left,
              width: spotlightPos.width,
              height: spotlightPos.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 20px rgba(88, 166, 255, 0.5)'
            }}
            animate={{
              boxShadow: [
                '0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 20px rgba(88, 166, 255, 0.5)',
                '0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 30px rgba(88, 166, 255, 0.8)',
                '0 0 0 9999px rgba(0, 0, 0, 0.8), 0 0 20px rgba(88, 166, 255, 0.5)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* Tutorial Card */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl max-w-2xl w-full backdrop-blur-md"
            style={{
              ...(step.position === 'center' ? {} : step.position === 'right' ? { marginRight: 'auto', marginLeft: '20%' } : { marginLeft: 'auto', marginRight: '20%' })
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-[#30363d]">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-white">{step.title}</h2>
                <button
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Skip tutorial"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>Step {currentStep + 1} of {TUTORIAL_STEPS.length}</span>
                <div className="flex-1 h-2 bg-[#21262d] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#58a6ff]"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                {step.message}
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#30363d] flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={isFirstStep}
                className={`flex items-center gap-2 px-4 py-2 rounded border transition-colors ${
                  isFirstStep
                    ? 'border-[#30363d] text-gray-600 cursor-not-allowed'
                    : 'border-[#30363d] text-white hover:bg-[#21262d]'
                }`}
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSkip}
                  className="flex items-center gap-2 px-4 py-2 rounded border border-[#30363d] text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
                >
                  <SkipForward size={16} />
                  Skip Tutorial
                </button>
                <button
                  onClick={handleNext}
                  className="px-6 py-2 rounded bg-[#58a6ff] text-white font-medium hover:bg-[#4493f8] transition-colors"
                >
                  {isLastStep ? 'Start Investigation' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

