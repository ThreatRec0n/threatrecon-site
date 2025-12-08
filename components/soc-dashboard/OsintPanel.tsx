'use client';

import { useState } from 'react';
import { OsintSimulator } from '@/lib/simulation-engine/osint-simulator';

interface OsintPanelProps {
  simulator: OsintSimulator;
  onLookupComplete: (lookup: any) => void;
}

export default function OsintPanel({ simulator, onLookupComplete }: OsintPanelProps) {
  const [indicator, setIndicator] = useState('');
  const [indicatorType, setIndicatorType] = useState<'ip' | 'domain' | 'hash'>('ip');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [lookupHistory, setLookupHistory] = useState<Array<{
    indicator: string;
    type: string;
    timestamp: Date;
    classification: string;
  }>>([]);
  
  const handleLookup = async () => {
    if (!indicator.trim()) return;
    
    setLoading(true);
    try {
      const result = await simulator.aggregateLookup(indicator, indicatorType);
      setResults(result);
      
      setLookupHistory(prev => [{
        indicator,
        type: indicatorType,
        timestamp: new Date(),
        classification: result.consensus.classification
      }, ...prev].slice(0, 10));
      
      onLookupComplete({
        indicator_value: indicator,
        indicator_type: indicatorType,
        ...result.consensus
      });
    } catch (error) {
      console.error('OSINT lookup error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'malicious': return 'text-red-500 bg-red-500/20';
      case 'suspicious': return 'text-yellow-500 bg-yellow-500/20';
      case 'benign': return 'text-green-500 bg-green-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-[#0d1117] rounded-lg border border-[#30363d]">
      <div className="p-4 border-b border-[#30363d]">
        <h2 className="text-xl font-bold text-white mb-4">🔍 OSINT Tools</h2>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder="Enter IP, domain, or hash..."
              className="flex-1 px-3 py-2 bg-[#161b22] border border-[#30363d] rounded text-white text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleLookup()}
            />
            <select
              value={indicatorType}
              onChange={(e) => setIndicatorType(e.target.value as any)}
              className="px-3 py-2 bg-[#161b22] border border-[#30363d] rounded text-white text-sm"
            >
              <option value="ip">IP Address</option>
              <option value="domain">Domain</option>
              <option value="hash">File Hash</option>
            </select>
          </div>
          
          <button
            onClick={handleLookup}
            disabled={loading || !indicator.trim()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                     disabled:cursor-not-allowed rounded text-white font-medium text-sm transition-colors"
          >
            {loading ? 'Analyzing...' : 'Lookup Indicator'}
          </button>
        </div>
      </div>
      
      {results && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4">
            <h3 className="text-sm font-bold text-white mb-3">Consensus Analysis</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Threat Score:</span>
                <span className="text-lg font-bold text-white">
                  {results.consensus.threat_score}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Classification:</span>
                <span className={`px-3 py-1 rounded text-sm font-medium ${getClassificationColor(results.consensus.classification)}`}>
                  {results.consensus.classification.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sources:</span>
                <span className="text-sm text-white">
                  {results.consensus.sources.join(', ')}
                </span>
              </div>
            </div>
          </div>
          
          {results.individual_results.map((item: any, idx: number) => (
            <div key={idx} className="bg-[#161b22] rounded-lg border border-[#30363d] p-4">
              <h3 className="text-sm font-bold text-white mb-2">{item.tool}</h3>
              <pre className="text-xs text-gray-400 overflow-x-auto">
                {JSON.stringify(item.result.details, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
      
      {lookupHistory.length > 0 && !results && (
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-bold text-white mb-3">Recent Lookups</h3>
          <div className="space-y-2">
            {lookupHistory.map((lookup, idx) => (
              <div key={idx} className="bg-[#161b22] rounded p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-blue-400">{lookup.indicator}</span>
                  <span className={`px-2 py-0.5 rounded ${getClassificationColor(lookup.classification)}`}>
                    {lookup.classification}
                  </span>
                </div>
                <div className="text-gray-500">
                  {lookup.type} • {lookup.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

