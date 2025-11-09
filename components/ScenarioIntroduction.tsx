'use client';

import { useState } from 'react';
import type { Scenario } from '@/lib/types';

interface Props {
  scenario: Scenario;
  onStart: () => void;
}

export default function ScenarioIntroduction({ scenario, onStart }: Props) {
  const [readMore, setReadMore] = useState(false);

  const timeLimit = 
    scenario.difficulty === 'beginner' ? 30 :
    scenario.difficulty === 'intermediate' ? 20 :
    15;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6">
        <div className="siem-card space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#c9d1d9]">{scenario.title}</h1>
            <div className="flex items-center justify-center gap-4 text-sm text-[#8b949e]">
              <span>Difficulty: {scenario.difficulty}</span>
              <span>•</span>
              <span>Time Limit: {timeLimit} minutes</span>
              <span>•</span>
              <span>Target IPs: {
                scenario.difficulty === 'beginner' ? 3 :
                scenario.difficulty === 'intermediate' ? 2 :
                1
              }</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-[#30363d]">
            <div>
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">Background</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                {scenario.narrative.background}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">The Incident</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                {scenario.narrative.incident}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">Your Mission</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                {scenario.narrative.yourRole}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2">Timeline</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                {scenario.narrative.timeline}
              </p>
            </div>

            {!readMore && (
              <button
                onClick={() => setReadMore(true)}
                className="text-sm text-[#58a6ff] hover:underline"
              >
                Read more about the threat...
              </button>
            )}

            {readMore && (
              <div className="space-y-3 pt-2 border-t border-[#30363d]">
                <div>
                  <h4 className="text-xs font-semibold text-[#c9d1d9] mb-1">⚠️ Critical Warning</h4>
                  <p className="text-xs text-red-400 leading-relaxed">
                    Ransomware deployment is imminent. You must identify and block all malicious IPs before the attack completes. 
                    Failure to do so will result in complete system encryption and data loss.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#c9d1d9] mb-1">🎯 Your Objective</h4>
                  <p className="text-xs text-[#8b949e] leading-relaxed">
                    Use the SIEM dashboard to search through logs, identify suspicious IP addresses, 
                    and classify them correctly. You need to find {
                      scenario.difficulty === 'beginner' ? '3' :
                      scenario.difficulty === 'intermediate' ? '2' :
                      '1'
                    } malicious IP{scenario.difficulty === 'beginner' ? 's' : ''} before time runs out.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-[#30363d]">
            <button
              onClick={onStart}
              className="w-full btn-primary py-3 text-lg font-semibold"
            >
              Start Threat Hunt
            </button>
            <p className="text-xs text-center text-[#8b949e] mt-3">
              The timer will start as soon as you click "Start Threat Hunt"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

