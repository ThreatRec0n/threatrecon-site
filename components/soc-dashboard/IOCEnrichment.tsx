'use client';

import { useState, useEffect } from 'react';

interface EnrichmentData {
  type: 'ip' | 'domain' | 'hash';
  value: string;
  threatScore?: number;
  reputation?: 'malicious' | 'suspicious' | 'clean' | 'unknown';
  geolocation?: {
    country: string;
    city?: string;
    asn?: string;
  };
  sources?: Array<{
    name: string;
    reputation: string;
    lastSeen?: string;
  }>;
  categories?: string[];
}

interface Props {
  ioc: string;
  type: 'ip' | 'domain' | 'hash';
  onClose: () => void;
}

export default function IOCEnrichment({ ioc, type, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EnrichmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate API calls to threat intel sources
    const fetchEnrichment = async () => {
      setLoading(true);
      setError(null);

      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock enrichment data
        const mockData: EnrichmentData = {
          type,
          value: ioc,
          threatScore: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 30),
          reputation: Math.random() > 0.7 ? 'malicious' : Math.random() > 0.5 ? 'suspicious' : 'clean',
          geolocation: type === 'ip' ? {
            country: ['United States', 'Russia', 'China', 'Germany'][Math.floor(Math.random() * 4)],
            city: ['New York', 'Moscow', 'Beijing', 'Berlin'][Math.floor(Math.random() * 4)],
            asn: `AS${Math.floor(Math.random() * 100000)}`,
          } : undefined,
          sources: [
            {
              name: 'VirusTotal',
              reputation: Math.random() > 0.6 ? 'malicious' : 'clean',
              lastSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              name: 'AbuseIPDB',
              reputation: Math.random() > 0.7 ? 'malicious' : 'clean',
            },
            {
              name: 'AlienVault OTX',
              reputation: Math.random() > 0.5 ? 'suspicious' : 'clean',
            },
          ],
          categories: type === 'ip' && Math.random() > 0.5
            ? ['C2 Server', 'Malware Distribution', 'Phishing']
            : type === 'domain' && Math.random() > 0.5
            ? ['Malware', 'Phishing']
            : [],
        };

        setData(mockData);
      } catch (err: any) {
        setError(err.message || 'Failed to enrich IOC');
      } finally {
        setLoading(false);
      }
    };

    fetchEnrichment();
  }, [ioc, type]);

  const getReputationColor = (reputation?: string) => {
    switch (reputation) {
      case 'malicious': return 'text-red-400 bg-red-900/40 border-red-800/60';
      case 'suspicious': return 'text-orange-400 bg-orange-900/40 border-orange-800/60';
      case 'clean': return 'text-green-400 bg-green-900/40 border-green-800/60';
      default: return 'text-gray-400 bg-gray-700/40 border-gray-600/60';
    }
  };

  return (
    <div className="siem-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#c9d1d9]">IOC Enrichment</h3>
        <button
          onClick={onClose}
          className="text-[#8b949e] hover:text-[#c9d1d9]"
        >
          ✕
        </button>
      </div>

      <div className="font-mono text-sm text-[#58a6ff]">{ioc}</div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58a6ff] mx-auto mb-2"></div>
          <p className="text-sm text-[#8b949e]">Querying threat intelligence sources...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* Threat Score */}
          {data.threatScore !== undefined && (
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] mb-2">Threat Score</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[#161b22] rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full ${
                      data.threatScore >= 70 ? 'bg-red-500' :
                      data.threatScore >= 50 ? 'bg-orange-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${data.threatScore}%` }}
                  />
                </div>
                <span className={`text-lg font-bold ${
                  data.threatScore >= 70 ? 'text-red-400' :
                  data.threatScore >= 50 ? 'text-orange-400' :
                  'text-yellow-400'
                }`}>
                  {data.threatScore}/100
                </span>
              </div>
            </div>
          )}

          {/* Overall Reputation */}
          {data.reputation && (
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] mb-2">Overall Reputation</h4>
              <span className={`px-3 py-1 text-sm font-medium rounded border ${getReputationColor(data.reputation)}`}>
                {data.reputation.toUpperCase()}
              </span>
            </div>
          )}

          {/* Geolocation */}
          {data.geolocation && (
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] mb-2">Geolocation</h4>
              <div className="bg-[#161b22] p-3 rounded border border-[#30363d] space-y-1">
                <div className="text-sm text-[#c9d1d9]">
                  <span className="font-semibold">Country:</span> {data.geolocation.country}
                </div>
                {data.geolocation.city && (
                  <div className="text-sm text-[#c9d1d9]">
                    <span className="font-semibold">City:</span> {data.geolocation.city}
                  </div>
                )}
                {data.geolocation.asn && (
                  <div className="text-sm text-[#c9d1d9]">
                    <span className="font-semibold">ASN:</span> {data.geolocation.asn}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Threat Intelligence Sources */}
          {data.sources && data.sources.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] mb-2">Threat Intelligence Sources</h4>
              <div className="space-y-2">
                {data.sources.map((source, idx) => (
                  <div key={idx} className="bg-[#161b22] p-2 rounded border border-[#30363d]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#c9d1d9]">{source.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded border ${getReputationColor(source.reputation)}`}>
                        {source.reputation}
                      </span>
                    </div>
                    {source.lastSeen && (
                      <div className="text-xs text-[#8b949e] mt-1">
                        Last seen: {new Date(source.lastSeen).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {data.categories && data.categories.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#8b949e] mb-2">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {data.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-red-900/40 text-red-400 border border-red-800/60 rounded"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          <div className="pt-3 border-t border-[#30363d]">
            <h4 className="text-xs font-semibold text-[#8b949e] mb-2">External Lookups</h4>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://www.virustotal.com/gui/search/${ioc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#58a6ff] hover:text-[#79c0ff]"
              >
                VirusTotal →
              </a>
              {type === 'ip' && (
                <a
                  href={`https://www.abuseipdb.com/check/${ioc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#58a6ff] hover:text-[#79c0ff]"
                >
                  AbuseIPDB →
                </a>
              )}
              <a
                href={`https://otx.alienvault.com/indicator/${type}/${ioc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#58a6ff] hover:text-[#79c0ff]"
              >
                AlienVault OTX →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

