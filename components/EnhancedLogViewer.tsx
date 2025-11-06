'use client';

import { useMemo, useState, useEffect } from 'react';
import Papa from 'papaparse';
import type { LogFilter } from '@/lib/types';

type Row = Record<string, unknown>;

interface EnhancedLogViewerProps {
  logFiles?: string[];
  initialData?: Row[];
  onEntityClick?: (entity: string, type: 'ip' | 'domain' | 'user' | 'process') => void;
}

export default function EnhancedLogViewer({ 
  logFiles = [],
  initialData,
  onEntityClick 
}: EnhancedLogViewerProps) {
  const [rows, setRows] = useState<Row[]>(initialData || []);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(!initialData);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [entityType, setEntityType] = useState<'ip' | 'domain' | 'user' | 'process' | null>(null);
  
  // Time range filter
  const [timeRange, setTimeRange] = useState<{ start: string; end: string } | null>(null);
  
  // Field-specific filters
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Auto-load logs if files provided
  useEffect(() => {
    if (initialData) {
      setLoading(false);
      return;
    }

    async function loadLogs() {
      if (logFiles.length === 0) {
        // Default: load sample logs
        try {
          const [zeekResponse, suricataResponse] = await Promise.all([
            fetch('/sample/zeek_conn_small.jsonl'),
            fetch('/sample/suricata_alerts_small.jsonl')
          ]);

          const zeekText = await zeekResponse.text();
          const suricataText = await suricataResponse.text();

          const zeekLines = zeekText.trim().split(/\r?\n/).filter(l => l.trim());
          const suricataLines = suricataText.trim().split(/\r?\n/).filter(l => l.trim());

          const zeekData = zeekLines.map(l => {
            try {
              return { ...JSON.parse(l), _source: 'zeek' };
            } catch {
              return null;
            }
          }).filter((r): r is Row => r !== null);

          const suricataData = suricataLines.map(l => {
            try {
              return { ...JSON.parse(l), _source: 'suricata' };
            } catch {
              return null;
            }
          }).filter((r): r is Row => r !== null);

          const combined = [...zeekData, ...suricataData];
          setRows(combined);
          setLoading(false);
        } catch (error) {
          console.error('Error loading sample logs:', error);
          setLoading(false);
        }
        return;
      }

      // Load specified log files
      try {
        const loadedData: Row[] = [];
        for (const file of logFiles) {
          const response = await fetch(file);
          const text = await response.text();
          const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
          const data = lines.map(l => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          }).filter((r): r is Row => r !== null);
          loadedData.push(...data);
        }
        setRows(loadedData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading logs:', error);
        setLoading(false);
      }
    }

    loadLogs();
  }, [logFiles, initialData]);

  // Extract available fields for filtering
  const availableFields = useMemo(() => {
    if (rows.length === 0) return [];
    const fields = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== '_source') fields.add(key);
      });
    });
    return Array.from(fields).sort();
  }, [rows]);

  // Filter rows based on all criteria
  const filtered = useMemo(() => {
    let result = rows;

    // Entity pivot filter
    if (selectedEntity && entityType) {
      result = result.filter(row => {
        const entityFields: Record<string, string[]> = {
          ip: ['id.orig_h', 'id.resp_h', 'src_ip', 'dest_ip', 'ip', 'source_ip', 'destination_ip'],
          domain: ['query', 'domain', 'hostname', 'fqdn'],
          user: ['user', 'username', 'account', 'user_id'],
          process: ['process', 'process_name', 'exe', 'command'],
        };

        const fields = entityFields[entityType] || [];
        return fields.some(field => {
          const value = row[field];
          return value && String(value).includes(selectedEntity);
        });
      });
    }

    // Time range filter
    if (timeRange?.start && timeRange?.end) {
      result = result.filter(row => {
        const timestamp = row.ts || row.timestamp || row.time || row['@timestamp'];
        if (!timestamp) return true;
        
        const rowTime = new Date(String(timestamp));
        const startTime = new Date(timeRange.start);
        const endTime = new Date(timeRange.end);
        
        return rowTime >= startTime && rowTime <= endTime;
      });
    }

    // Field-specific filters
    Object.entries(fieldFilters).forEach(([field, value]) => {
      if (value.trim()) {
        result = result.filter(row => {
          const fieldValue = row[field];
          return fieldValue && String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Text query filter
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    }

    return result;
  }, [rows, selectedEntity, entityType, timeRange, fieldFilters, query]);

  // Extract columns
  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    const cols = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(key => {
        if (key !== '_source') cols.add(key);
      });
    });
    return Array.from(cols).sort();
  }, [rows]);

  // Handle entity click (pivot)
  function handleEntityClick(value: string, field: string) {
    // Detect entity type from field name
    let type: 'ip' | 'domain' | 'user' | 'process' = 'ip';
    
    if (field.includes('ip') || field.includes('IP')) {
      type = 'ip';
    } else if (field.includes('domain') || field.includes('hostname') || field.includes('query')) {
      type = 'domain';
    } else if (field.includes('user') || field.includes('account')) {
      type = 'user';
    } else if (field.includes('process') || field.includes('exe') || field.includes('command')) {
      type = 'process';
    }

    setSelectedEntity(value);
    setEntityType(type);
    
    if (onEntityClick) {
      onEntityClick(value, type);
    }
  }

  function clearEntityPivot() {
    setSelectedEntity(null);
    setEntityType(null);
  }

  function updateFieldFilter(field: string, value: string) {
    setFieldFilters(prev => {
      if (value.trim()) {
        return { ...prev, [field]: value };
      } else {
        const newFilters = { ...prev };
        delete newFilters[field];
        return newFilters;
      }
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b949e]">🔍</span>
            <input
              className="search-input w-full pl-10 pr-4"
              placeholder="Search logs..."
              disabled
            />
          </div>
        </div>
        <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22] p-12 text-center">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <p className="text-[#8b949e]">Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <label className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border border-[#30363d] rounded-md hover:bg-[#21262d] cursor-pointer transition-colors">
            <span className="text-sm text-[#c9d1d9]">📁</span>
            <span className="text-sm font-medium text-[#c9d1d9]">Upload</span>
            <input 
              type="file" 
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) f.text().then(text => {
                  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
                  const data = lines.map(l => {
                    try {
                      return JSON.parse(l);
                    } catch {
                      return null;
                    }
                  }).filter((r): r is Row => r !== null);
                  setRows(data);
                });
              }}
              className="hidden"
              accept=".json,.jsonl,.csv,.txt"
            />
          </label>
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b949e]">🔍</span>
            <input
              className="search-input w-full pl-10 pr-4"
              placeholder="Search logs... (e.g., 10.0.1.5, ET MALWARE, tcp)"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-md border transition-colors ${
              showFilters || Object.keys(fieldFilters).length > 0 || timeRange
                ? 'bg-[#21262d] border-[#58a6ff] text-[#58a6ff]'
                : 'bg-[#161b22] border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d]'
            }`}
          >
            🔧 Filters
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="siem-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#c9d1d9]">Advanced Filters</h3>
              <button
                onClick={() => {
                  setTimeRange(null);
                  setFieldFilters({});
                }}
                className="text-xs text-[#8b949e] hover:text-[#58a6ff]"
              >
                Clear All
              </button>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#8b949e] mb-1 block">Start Time</label>
                <input
                  type="datetime-local"
                  value={timeRange?.start || ''}
                  onChange={e => setTimeRange(prev => ({ 
                    start: e.target.value, 
                    end: prev?.end || '' 
                  }))}
                  className="search-input w-full"
                />
              </div>
              <div>
                <label className="text-xs text-[#8b949e] mb-1 block">End Time</label>
                <input
                  type="datetime-local"
                  value={timeRange?.end || ''}
                  onChange={e => setTimeRange(prev => ({ 
                    start: prev?.start || '', 
                    end: e.target.value 
                  }))}
                  className="search-input w-full"
                />
              </div>
            </div>

            {/* Field Filters */}
            <div>
              <label className="text-xs text-[#8b949e] mb-2 block">Field-Specific Filters</label>
              <div className="space-y-2">
                {availableFields.slice(0, 5).map(field => (
                  <div key={field} className="flex items-center gap-2">
                    <span className="text-xs text-[#8b949e] w-32 truncate">{field}</span>
                    <input
                      type="text"
                      value={fieldFilters[field] || ''}
                      onChange={e => updateFieldFilter(field, e.target.value)}
                      placeholder="Filter value..."
                      className="search-input flex-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Entity Pivot Indicator */}
        {selectedEntity && entityType && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#58a6ff] rounded-md">
            <span className="text-sm text-[#58a6ff]">
              🔗 Pivoting on {entityType}: <strong>{selectedEntity}</strong>
            </span>
            <button
              onClick={clearEntityPivot}
              className="ml-auto text-xs text-[#8b949e] hover:text-[#f85149]"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar */}
      {rows.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="text-[#8b949e]">
              <span className="text-[#c9d1d9] font-semibold">{filtered.length}</span> of <span className="text-[#c9d1d9] font-semibold">{rows.length}</span> events
            </div>
            {(selectedEntity || Object.keys(fieldFilters).length > 0 || timeRange) && (
              <div className="px-2 py-1 bg-[#161b22] border border-[#30363d] rounded text-[#8b949e] text-xs">
                Filtered
              </div>
            )}
          </div>
          <div className="text-[#8b949e]">
            Showing first 500 results
          </div>
        </div>
      )}

      {/* Professional Table */}
      <div className="border border-[#30363d] rounded-lg overflow-hidden bg-[#161b22]">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] border-b border-[#30363d] sticky top-0 z-10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">#</th>
                  {columns.slice(0, 7).map((col) => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      {col.length > 20 ? `${col.substring(0, 20)}...` : col}
                    </th>
                  ))}
                  {columns.length > 7 && (
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                      +{columns.length - 7} more
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]">
                {filtered.slice(0, 500).map((r, i) => (
                  <tr key={`row-${i}`} className="log-row group">
                    <td className="px-4 py-3 text-[#8b949e] font-mono text-xs">
                      {i + 1}
                    </td>
                    {columns.slice(0, 7).map((col) => {
                      const value = r[col];
                      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
                      const isEntity = col.includes('ip') || col.includes('domain') || col.includes('user') || col.includes('process');
                      
                      return (
                        <td key={col} className="px-4 py-3 log-mono text-[#c9d1d9] max-w-xs">
                          {isEntity && displayValue ? (
                            <button
                              onClick={() => handleEntityClick(displayValue, col)}
                              className="truncate hover:text-[#58a6ff] hover:underline transition-colors"
                              title={`Click to pivot on ${displayValue}`}
                            >
                              {displayValue.length > 50 ? `${displayValue.substring(0, 50)}...` : displayValue}
                            </button>
                          ) : (
                            <div className="truncate" title={displayValue}>
                              {displayValue.length > 50 ? `${displayValue.substring(0, 50)}...` : displayValue}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    {columns.length > 7 && (
                      <td className="px-4 py-3 text-[#8b949e] text-xs">
                        <button className="hover:text-[#58a6ff] transition-colors">
                          View all
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-[#8b949e] mb-2">
              {rows.length === 0 ? 'No logs loaded' : 'No results match your filters'}
            </p>
            <p className="text-sm text-[#484f58]">
              {rows.length === 0 
                ? 'Upload a log file to begin analysis' 
                : 'Try adjusting your filters or search query'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

