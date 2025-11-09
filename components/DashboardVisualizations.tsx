'use client';

import { useMemo } from 'react';
import type { SIEMEvent, SecurityAlert } from '@/lib/types';

interface Props {
  events: SIEMEvent[];
  alerts: SecurityAlert[];
}

export default function DashboardVisualizations({ events, alerts }: Props) {
  // Log Volume by Source
  const logVolumeBySource = useMemo(() => {
    const volume: Record<string, number> = {};
    events.forEach(event => {
      const source = event.eventType || 'Unknown';
      volume[source] = (volume[source] || 0) + 1;
    });
    return Object.entries(volume).sort((a, b) => b[1] - a[1]);
  }, [events]);

  // Log Volume by Host
  const logVolumeByHost = useMemo(() => {
    const volume: Record<string, number> = {};
    events.forEach(event => {
      const host = event.sourceIP?.split('.').slice(0, 3).join('.') || 'Unknown';
      volume[host] = (volume[host] || 0) + 1;
    });
    return Object.entries(volume).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [events]);

  // Top Alerting Hosts
  const topAlertingHosts = useMemo(() => {
    const hostCounts: Record<string, { count: number; severity: string }> = {};
    alerts.forEach(alert => {
      if (alert.hostname) {
        if (!hostCounts[alert.hostname]) {
          hostCounts[alert.hostname] = { count: 0, severity: alert.severity };
        }
        hostCounts[alert.hostname].count++;
      }
    });
    return Object.entries(hostCounts)
      .sort((a, b) => {
        // Sort by severity first, then count
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        const aSev = severityOrder[a[1].severity as keyof typeof severityOrder] || 0;
        const bSev = severityOrder[b[1].severity as keyof typeof severityOrder] || 0;
        if (aSev !== bSev) return bSev - aSev;
        return b[1].count - a[1].count;
      })
      .slice(0, 10);
  }, [alerts]);

  // Top Users with Events
  const topUsers = useMemo(() => {
    const userCounts: Record<string, { total: number; failures: number }> = {};
    events.forEach(event => {
      // Extract user from message if available
      const userMatch = event.message?.match(/user[:\s]+(\w+)/i) || 
                       event.message?.match(/login[:\s]+(\w+)/i);
      if (userMatch) {
        const user = userMatch[1];
        if (!userCounts[user]) {
          userCounts[user] = { total: 0, failures: 0 };
        }
        userCounts[user].total++;
        if (event.message?.toLowerCase().includes('fail') || 
            event.message?.toLowerCase().includes('denied')) {
          userCounts[user].failures++;
        }
      }
    });
    return Object.entries(userCounts)
      .sort((a, b) => {
        // Sort by failures first, then total
        if (a[1].failures !== b[1].failures) return b[1].failures - a[1].failures;
        return b[1].total - a[1].total;
      })
      .slice(0, 10);
  }, [events]);

  // MITRE ATT&CK Coverage
  const mitreCoverage = useMemo(() => {
    const tactics: Record<string, number> = {};
    alerts.forEach(alert => {
      alert.mitreTactics?.forEach(tactic => {
        tactics[tactic] = (tactics[tactic] || 0) + 1;
      });
    });
    return Object.entries(tactics).sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  // Detections by Technique
  const detectionsByTechnique = useMemo(() => {
    const techniques: Record<string, number> = {};
    alerts.forEach(alert => {
      alert.mitreTechniques?.forEach(tech => {
        techniques[tech] = (techniques[tech] || 0) + 1;
      });
    });
    return Object.entries(techniques).sort((a, b) => b[1] - a[1]);
  }, [alerts]);

  // Time Series Data (last 24 hours, hourly buckets)
  const timeSeriesData = useMemo(() => {
    const now = Date.now();
    const buckets: Record<number, { total: number; malicious: number; failed: number }> = {};
    
    // Initialize 24 buckets (one per hour)
    for (let i = 23; i >= 0; i--) {
      buckets[i] = { total: 0, malicious: 0, failed: 0 };
    }

    events.forEach(event => {
      const eventTime = new Date(event.timestamp).getTime();
      const hoursAgo = Math.floor((now - eventTime) / (1000 * 60 * 60));
      if (hoursAgo >= 0 && hoursAgo < 24) {
        buckets[hoursAgo].total++;
        if (event.message?.toLowerCase().includes('malicious') || 
            event.message?.toLowerCase().includes('suspicious')) {
          buckets[hoursAgo].malicious++;
        }
        if (event.message?.toLowerCase().includes('fail') || 
            event.message?.toLowerCase().includes('denied')) {
          buckets[hoursAgo].failed++;
        }
      }
    });

    return Object.entries(buckets)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        label: `${23 - parseInt(hour)}h ago`,
        ...data,
      }))
      .reverse();
  }, [events]);

  // Geo IP data (simplified - just show external IPs)
  const geoIPData = useMemo(() => {
    const ipCountries: Record<string, number> = {};
    events.forEach(event => {
      const ip = event.destinationIP;
      if (ip && !ip.startsWith('10.') && !ip.startsWith('192.168.') && !ip.startsWith('172.')) {
        // Simplified: use first octet to simulate country
        const countryCode = ['US', 'CN', 'RU', 'DE', 'GB', 'FR', 'JP', 'BR'][
          parseInt(ip.split('.')[0]) % 8
        ];
        ipCountries[countryCode] = (ipCountries[countryCode] || 0) + 1;
      }
    });
    return Object.entries(ipCountries).sort((a, b) => b[1] - a[1]);
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Log Volume by Source */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">📈 Log Volume by Source</h3>
        <div className="space-y-2">
          {logVolumeBySource.map(([source, count]) => (
            <div key={source} className="flex items-center justify-between">
              <span className="text-sm text-[#c9d1d9]">{source}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-[#0d1117] rounded-full h-2">
                  <div 
                    className="bg-[#58a6ff] h-2 rounded-full"
                    style={{ width: `${(count / logVolumeBySource[0][1]) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-[#8b949e] w-12 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Log Volume by Host */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">📈 Log Volume by Host</h3>
        <div className="space-y-2">
          {logVolumeByHost.map(([host, count]) => (
            <div key={host} className="flex items-center justify-between">
              <span className="text-sm font-mono text-[#c9d1d9]">{host}.x</span>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-[#0d1117] rounded-full h-2">
                  <div 
                    className="bg-[#3fb950] h-2 rounded-full"
                    style={{ width: `${(count / logVolumeByHost[0][1]) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-[#8b949e] w-12 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Alerting Hosts */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">🔥 Top Alerting Hosts</h3>
        <div className="space-y-2">
          {topAlertingHosts.map(([hostname, data]) => (
            <div key={hostname} className="flex items-center justify-between p-2 bg-[#0d1117] rounded">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-[#c9d1d9]">{hostname}</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  data.severity === 'critical' ? 'bg-red-900/40 text-red-400 border border-red-800/60' :
                  data.severity === 'high' ? 'bg-orange-900/40 text-orange-400 border border-orange-800/60' :
                  data.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/60' :
                  'bg-blue-900/40 text-blue-400 border border-blue-800/60'
                }`}>
                  {data.severity}
                </span>
              </div>
              <span className="text-sm text-[#8b949e]">{data.count} alerts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Users */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">👤 Top Users with Events</h3>
        <div className="space-y-2">
          {topUsers.map(([user, data]) => (
            <div key={user} className="flex items-center justify-between p-2 bg-[#0d1117] rounded">
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#c9d1d9]">{user}</span>
                {data.failures > 0 && (
                  <span className="px-2 py-1 text-xs bg-red-900/40 text-red-400 border border-red-800/60 rounded">
                    {data.failures} failures
                  </span>
                )}
              </div>
              <span className="text-sm text-[#8b949e]">{data.total} events</span>
            </div>
          ))}
        </div>
      </div>

      {/* Geo Map */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">🌍 External IP Connections by Country</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {geoIPData.map(([country, count]) => (
            <div key={country} className="bg-[#0d1117] p-3 rounded border border-[#30363d] text-center">
              <div className="text-2xl mb-1">{getCountryFlag(country)}</div>
              <div className="text-xs text-[#8b949e]">{country}</div>
              <div className="text-lg font-bold text-[#c9d1d9]">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* MITRE ATT&CK Coverage Heatmap */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">🧬 MITRE ATT&CK Coverage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {mitreCoverage.map(([tactic, count]) => {
            const maxCount = Math.max(...mitreCoverage.map(([, c]) => c));
            const intensity = count / maxCount;
            return (
              <div 
                key={tactic} 
                className="bg-[#0d1117] p-3 rounded border border-[#30363d]"
                style={{
                  backgroundColor: `rgba(88, 166, 255, ${intensity * 0.2})`,
                  borderColor: `rgba(88, 166, 255, ${intensity * 0.5})`,
                }}
              >
                <div className="text-xs text-[#8b949e] mb-1">{tactic}</div>
                <div className="text-xl font-bold text-[#58a6ff]">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detections by Technique */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">🧩 Detections by Tactic / Technique</h3>
        <div className="space-y-2">
          {detectionsByTechnique.map(([technique, count]) => (
            <div key={technique} className="flex items-center justify-between p-2 bg-[#0d1117] rounded">
              <span className="text-sm font-mono text-[#58a6ff]">{technique}</span>
              <span className="text-sm text-[#8b949e]">{count} detections</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Series Graph */}
      <div className="siem-card">
        <h3 className="text-lg font-semibold text-[#c9d1d9] mb-4">⏳ Time Series - Events Over Last 24 Hours</h3>
        <div className="h-64 flex items-end gap-1">
          {timeSeriesData.map((data, idx) => {
            const maxValue = Math.max(...timeSeriesData.map(d => d.total));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-[#58a6ff] rounded-t"
                    style={{ height: `${(data.total / maxValue) * 100}%` }}
                    title={`${data.label}: ${data.total} total, ${data.malicious} malicious, ${data.failed} failed`}
                  />
                  {data.malicious > 0 && (
                    <div 
                      className="w-full bg-red-500 rounded-t"
                      style={{ height: `${(data.malicious / maxValue) * 100}%` }}
                    />
                  )}
                  {data.failed > 0 && (
                    <div 
                      className="w-full bg-orange-500 rounded-t"
                      style={{ height: `${(data.failed / maxValue) * 100}%` }}
                    />
                  )}
                </div>
                {idx % 4 === 0 && (
                  <span className="text-xs text-[#8b949e] mt-1">{data.label}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-[#8b949e]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#58a6ff] rounded"></div>
            <span>Total Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Malicious</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Failed Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getCountryFlag(country: string): string {
  const flags: Record<string, string> = {
    'US': '🇺🇸',
    'CN': '🇨🇳',
    'RU': '🇷🇺',
    'DE': '🇩🇪',
    'GB': '🇬🇧',
    'FR': '🇫🇷',
    'JP': '🇯🇵',
    'BR': '🇧🇷',
  };
  return flags[country] || '🌍';
}

