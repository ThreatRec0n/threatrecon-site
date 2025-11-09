'use client';

import { useState, useEffect } from 'react';
import { lookupThreatIntel } from '@/lib/threat-intel';
import type { ThreatIntelLookupResult } from '@/lib/threat-intel';

interface Props {
  type: 'ip' | 'domain' | 'hash';
  value: string;
  onClose: () => void;
}

export default function ThreatIntelPanel({ type, value, onClose }: Props) {
  const [result, setResult] = useState<ThreatIntelLookupResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThreatIntel() {
      setLoading(true);
      try {
        const lookupResult = await lookupThreatIntel(type, value);
        setResult(lookupResult);
      } catch (error) {
        console.error('Error looking up threat intel:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchThreatIntel();
  }, [type, value]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#c9d1d9]">Threat Intelligence Lookup</h3>
          <button onClick={onClose} className="text-[#8b949e] hover:text-[#c9d1d9]">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <div className="text-xs text-[#8b949e] mb-1">Type</div>
            <div className="text-sm text-[#c9d1d9] font-mono">{type.toUpperCase()}</div>
          </div>
          <div>
            <div className="text-xs text-[#8b949e] mb-1">Value</div>
            <div className="text-sm text-[#c9d1d9] font-mono">{value}</div>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-[#8b949e]">Loading threat intelligence data...</div>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Reputation</div>
                <div className={`text-sm font-semibold ${
                  result.reputation === 'malicious' ? 'text-red-400' :
                  result.reputation === 'suspicious' ? 'text-orange-400' :
                  result.reputation === 'clean' ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {result.reputation.toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8b949e] mb-1">Confidence</div>
                <div className="text-sm text-[#c9d1d9]">{result.confidence}%</div>
              </div>
              
              {result.matches.length > 0 && (
                <div>
                  <div className="text-xs text-[#8b949e] mb-2">Matches</div>
                  <div className="space-y-2">
                    {result.matches.map((match, idx) => (
                      <div key={idx} className="bg-[#0d1117] p-3 rounded border border-[#30363d]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-[#c9d1d9]">{match.source}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            match.reputation === 'malicious' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                            match.reputation === 'suspicious' ? 'bg-orange-900/40 text-orange-400 border border-orange-800/60' :
                            'bg-gray-700/40 text-gray-400 border border-gray-600/60'
                          }`}>
                            {match.reputation}
                          </span>
                        </div>
                        {match.description && (
                          <div className="text-xs text-[#8b949e] mt-1">{match.description}</div>
                        )}
                        {match.country && (
                          <div className="text-xs text-[#8b949e] mt-1">Country: {match.country}</div>
                        )}
                        {match.malwareFamily && (
                          <div className="text-xs text-[#8b949e] mt-1">Malware: {match.malwareFamily}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#8b949e]">No threat intelligence data found</div>
          )}
        </div>
      </div>
    </div>
  );
}

