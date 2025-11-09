'use client';

import { useState } from 'react';

type IOCTag = 'confirmed-threat' | 'suspicious' | 'benign';

interface Props {
  iocs: {
    ips: string[];
    domains: string[];
    hashes: string[];
    pids: string[];
  };
  tags: Record<string, IOCTag>;
  onTagChange: (ioc: string, tag: IOCTag) => void;
  onEnrich?: (ioc: string, type: 'ip' | 'domain' | 'hash') => void;
}

export default function IOCTaggingPanel({ iocs, tags, onTagChange, onEnrich }: Props) {
  const [activeTab, setActiveTab] = useState<'ips' | 'domains' | 'hashes' | 'pids'>('ips');
  const [searchQuery, setSearchQuery] = useState('');

  const getCurrentIOCs = () => {
    let current: string[] = [];
    switch (activeTab) {
      case 'ips': current = iocs.ips; break;
      case 'domains': current = iocs.domains; break;
      case 'hashes': current = iocs.hashes; break;
      case 'pids': current = iocs.pids; break;
    }
    
    if (searchQuery) {
      return current.filter(ioc => ioc.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return current;
  };

  const getTagColor = (tag: IOCTag | undefined) => {
    switch (tag) {
      case 'confirmed-threat': return 'bg-red-900/40 text-red-400 border-red-800/60';
      case 'suspicious': return 'bg-orange-900/40 text-orange-400 border-orange-800/60';
      case 'benign': return 'bg-green-900/40 text-green-400 border-green-800/60';
      default: return 'bg-gray-700/40 text-gray-400 border-gray-600/60';
    }
  };

  const getTagLabel = (tag: IOCTag | undefined) => {
    switch (tag) {
      case 'confirmed-threat': return '✅ Confirmed Threat';
      case 'suspicious': return '❓ Suspicious';
      case 'benign': return '❌ Benign';
      default: return 'Unclassified';
    }
  };

  const currentIOCs = getCurrentIOCs();
  const tagCounts = {
    'confirmed-threat': currentIOCs.filter(ioc => tags[ioc] === 'confirmed-threat').length,
    'suspicious': currentIOCs.filter(ioc => tags[ioc] === 'suspicious').length,
    'benign': currentIOCs.filter(ioc => tags[ioc] === 'benign').length,
    'unclassified': currentIOCs.filter(ioc => !tags[ioc]).length,
  };

  return (
    <div className="siem-card space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#c9d1d9]">IOC Tagging Panel</h2>
        <p className="text-xs text-[#8b949e] mt-1">
          Tag indicators as threats, suspicious, or benign. Tags are saved per session.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#30363d]">
        {(['ips', 'domains', 'hashes', 'pids'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setSearchQuery('');
            }}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#58a6ff] text-[#58a6ff]'
                : 'border-transparent text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({iocs[tab].length})
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={`Search ${activeTab}...`}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input w-full"
      />

      {/* Tag Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-red-900/20 p-2 rounded border border-red-800/40">
          <div className="text-red-400 font-semibold">Threats</div>
          <div className="text-[#c9d1d9]">{tagCounts['confirmed-threat']}</div>
        </div>
        <div className="bg-orange-900/20 p-2 rounded border border-orange-800/40">
          <div className="text-orange-400 font-semibold">Suspicious</div>
          <div className="text-[#c9d1d9]">{tagCounts['suspicious']}</div>
        </div>
        <div className="bg-green-900/20 p-2 rounded border border-green-800/40">
          <div className="text-green-400 font-semibold">Benign</div>
          <div className="text-[#c9d1d9]">{tagCounts['benign']}</div>
        </div>
        <div className="bg-gray-700/20 p-2 rounded border border-gray-600/40">
          <div className="text-gray-400 font-semibold">Unclassified</div>
          <div className="text-[#c9d1d9]">{tagCounts['unclassified']}</div>
        </div>
      </div>

      {/* IOC List */}
      <div className="space-y-2 max-h-[calc(100vh-500px)] overflow-y-auto">
        {currentIOCs.length === 0 && (
          <p className="text-center text-[#8b949e] py-8 text-sm">
            No {activeTab} found{searchQuery ? ' matching search' : ''}.
          </p>
        )}
        {currentIOCs.map(ioc => {
          const currentTag = tags[ioc];
          return (
            <div
              key={ioc}
              className="flex items-center justify-between p-2 rounded border border-[#30363d] bg-[#0d1117] hover:bg-[#161b22]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono text-[#c9d1d9] truncate">{ioc}</p>
                <p className={`text-xs mt-1 ${getTagColor(currentTag)} px-2 py-0.5 rounded border inline-block`}>
                  {getTagLabel(currentTag)}
                </p>
              </div>
              <div className="flex items-center gap-1 ml-2">
                {onEnrich && (activeTab === 'ips' || activeTab === 'domains' || activeTab === 'hashes') && (
                  <button
                    onClick={() => onEnrich(ioc, activeTab as 'ip' | 'domain' | 'hash')}
                    className="px-2 py-1 text-xs rounded border bg-[#161b22] text-[#58a6ff] border-[#30363d] hover:border-[#58a6ff]"
                    title="Enrich IOC"
                  >
                    🔍
                  </button>
                )}
                <button
                  onClick={() => onTagChange(ioc, 'confirmed-threat')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    currentTag === 'confirmed-threat'
                      ? 'bg-red-900/40 text-red-400 border-red-800/60'
                      : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-red-800/60'
                  }`}
                  title="Mark as Confirmed Threat"
                >
                  ✅
                </button>
                <button
                  onClick={() => onTagChange(ioc, 'suspicious')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    currentTag === 'suspicious'
                      ? 'bg-orange-900/40 text-orange-400 border-orange-800/60'
                      : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-orange-800/60'
                  }`}
                  title="Mark as Suspicious"
                >
                  ❓
                </button>
                <button
                  onClick={() => onTagChange(ioc, 'benign')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    currentTag === 'benign'
                      ? 'bg-green-900/40 text-green-400 border-green-800/60'
                      : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:border-green-800/60'
                  }`}
                  title="Mark as Benign"
                >
                  ❌
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

