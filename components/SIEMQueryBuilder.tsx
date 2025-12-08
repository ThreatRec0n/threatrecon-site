'use client';

import { useState, useRef, useEffect } from 'react';
import type { SimulatedEvent } from '@/lib/simulation-engine/core-types';

export type QuerySyntax = 'SPL' | 'KQL' | 'ELK';

interface Query {
  id: string;
  query: string;
  syntax: QuerySyntax;
  timestamp: Date;
  results?: QueryResult;
}

interface QueryResult {
  eventCount: number;
  events: SimulatedEvent[];
  executionTime: number; // milliseconds
  fieldsScanned: string[];
}

interface Props {
  events: SimulatedEvent[];
  onQueryExecute: (query: string, syntax: QuerySyntax) => QueryResult;
  savedSearches?: Query[];
  onSaveSearch?: (query: Query) => void;
}

export default function SIEMQueryBuilder({ 
  events, 
  onQueryExecute,
  savedSearches = [],
  onSaveSearch
}: Props) {
  const [query, setQuery] = useState('');
  const [syntax, setSyntax] = useState<QuerySyntax>('SPL');
  const [queryHistory, setQueryHistory] = useState<Query[]>([]);
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Field autocomplete suggestions
  const fieldSuggestions: Record<string, string[]> = {
    SPL: [
      'source=', 'host=', 'user=', 'process=', 'command=', 'ip=', 'port=',
      'EventID=', 'Image=', 'CommandLine=', 'ParentImage=', 'DestinationIp=',
      'DestinationPort=', 'query=', 'method=', 'status_code=',
      'index=', 'stats', 'where', 'join', 'timechart', 'rare', 'count',
    ],
    KQL: [
      'where', 'project', 'summarize', 'join', 'union', 'extend', 'parse',
      'render', 'take', 'order by', 'count', 'distinct',
      'EventID', 'Computer', 'Image', 'CommandLine', 'User',
      'SourceIp', 'DestinationIp', 'DestinationPort',
    ],
    ELK: [
      'source:', 'host:', 'user:', 'process:', 'command:', 'ip:', 'port:',
      'EventID:', 'Image:', 'CommandLine:', 'ParentImage:', 'DestinationIp:',
      'AND', 'OR', 'NOT', 'exists:', 'range:', 'match:', 'wildcard:',
    ],
  };

  // Example queries
  const exampleQueries: Record<QuerySyntax, string[]> = {
    SPL: [
      'source=sysmon EventID=1 powershell.exe | stats count by CommandLine, ParentImage',
      'source=sysmon EventID=1 | where CommandLine contains "hidden" OR CommandLine contains "bypass"',
      'source=zeek | timechart span=5m count by DestinationIp | where count > 100',
      'source=sysmon EventID=3 | rare limit=20 DestinationIp | where count < 5',
      'index=windows EventID=4625 | join user [search index=firewall action=block] | stats count by user, src_ip',
    ],
    KQL: [
      'SysmonEvents | where EventID == 1 and Image contains "powershell" | summarize count() by CommandLine',
      'NetworkEvents | where DestinationPort > 8000 | summarize count() by DestinationIp | where count_ > 10',
      'SysmonEvents | where EventID == 1 | summarize count() by bin(TimeGenerated, 5m), Image',
      'SysmonEvents | where EventID == 3 | summarize count() by DestinationIp | order by count_ asc | take 20',
    ],
    ELK: [
      'source:sysmon AND EventID:1 AND Image:powershell.exe',
      'source:zeek AND DestinationPort:>8000',
      'source:sysmon AND EventID:1 AND (CommandLine:*hidden* OR CommandLine:*bypass*)',
      'source:sysmon AND EventID:3 AND NOT DestinationIp:10.0.0.0/8',
    ],
  };

  useEffect(() => {
    // Update autocomplete suggestions based on syntax
    setAutocompleteSuggestions(fieldSuggestions[syntax] || []);
  }, [syntax]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
    
    // Show autocomplete if typing a field name
    const lastWord = value.substring(0, cursorPosition).split(/\s+/).pop() || '';
    if (lastWord.length > 0 && fieldSuggestions[syntax].some(f => f.startsWith(lastWord))) {
      setShowAutocomplete(true);
      setAutocompleteSuggestions(
        fieldSuggestions[syntax].filter(f => f.startsWith(lastWord))
      );
    } else {
      setShowAutocomplete(false);
    }
  }

  function handleExecute() {
    if (!query.trim()) return;
    
    setIsExecuting(true);
    
    try {
      const result = onQueryExecute(query, syntax);
      setCurrentResult(result);
      
      // Add to history
      const queryEntry: Query = {
        id: `query-${Date.now()}`,
        query,
        syntax,
        timestamp: new Date(),
        results: result,
      };
      setQueryHistory(prev => [queryEntry, ...prev].slice(0, 50)); // Keep last 50
    } catch (error) {
      console.error('Query execution error:', error);
      setCurrentResult({
        eventCount: 0,
        events: [],
        executionTime: 0,
        fieldsScanned: [],
      });
    } finally {
      setIsExecuting(false);
    }
  }

  function handleSaveSearch() {
    if (!query.trim() || !onSaveSearch) return;
    
    const queryEntry: Query = {
      id: `saved-${Date.now()}`,
      query,
      syntax,
      timestamp: new Date(),
    };
    
    onSaveSearch(queryEntry);
  }

  function insertExample(exampleQuery: string) {
    setQuery(exampleQuery);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  function insertSuggestion(suggestion: string) {
    const beforeCursor = query.substring(0, cursorPosition);
    const afterCursor = query.substring(cursorPosition);
    const lastSpace = beforeCursor.lastIndexOf(' ');
    const newQuery = beforeCursor.substring(0, lastSpace + 1) + suggestion + ' ' + afterCursor;
    setQuery(newQuery);
    setShowAutocomplete(false);
    
    if (textareaRef.current) {
      setTimeout(() => {
        const newPosition = lastSpace + 1 + suggestion.length + 1;
        textareaRef.current?.setSelectionRange(newPosition, newPosition);
        textareaRef.current?.focus();
      }, 0);
    }
  }

  function formatQuery(query: string): string {
    // Simple syntax highlighting (basic implementation)
    const keywords = ['where', 'stats', 'count', 'by', 'join', 'timechart', 'rare', 'limit', 'contains', 'AND', 'OR', 'NOT'];
    let formatted = query;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      formatted = formatted.replace(regex, `<span class="text-[#58a6ff]">${keyword}</span>`);
    });
    
    return formatted;
  }

  return (
    <div className="space-y-4">
      <div className="siem-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#c9d1d9]">SIEM Query Builder</h3>
          <div className="flex items-center gap-2">
            <select
              value={syntax}
              onChange={e => setSyntax(e.target.value as QuerySyntax)}
              className="px-3 py-1 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9]"
            >
              <option value="SPL">SPL (Splunk)</option>
              <option value="KQL">KQL (Kusto)</option>
              <option value="ELK">ELK (Elasticsearch)</option>
            </select>
          </div>
        </div>

        {/* Query Input */}
        <div className="relative mb-4">
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleExecute();
              }
              if (e.key === 'Escape') {
                setShowAutocomplete(false);
              }
            }}
            onSelect={(e) => {
              if (textareaRef.current) {
                setCursorPosition(textareaRef.current.selectionStart);
              }
            }}
            placeholder={`Enter ${syntax} query... (Ctrl+Enter to execute)`}
            className="w-full h-32 px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded font-mono text-sm text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] resize-none"
            style={{ fontFamily: 'monospace' }}
          />
          
          {/* Autocomplete Dropdown */}
          {showAutocomplete && autocompleteSuggestions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#161b22] border border-[#30363d] rounded shadow-lg max-h-48 overflow-y-auto z-10">
              {autocompleteSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => insertSuggestion(suggestion)}
                  className="w-full text-left px-4 py-2 text-sm text-[#c9d1d9] hover:bg-[#0d1117] border-b border-[#30363d] last:border-b-0"
                >
                  <span className="text-[#58a6ff]">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Example Queries */}
        <div className="mb-4">
          <div className="text-xs text-[#8b949e] mb-2">Example Queries:</div>
          <div className="flex flex-wrap gap-2">
            {exampleQueries[syntax].slice(0, 3).map((example, idx) => (
              <button
                key={idx}
                onClick={() => insertExample(example)}
                className="px-3 py-1 text-xs bg-[#161b22] border border-[#30363d] rounded text-[#8b949e] hover:text-[#c9d1d9] hover:border-[#58a6ff]/50"
              >
                Example {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handleExecute}
            disabled={!query.trim() || isExecuting}
            className="px-4 py-2 bg-[#238636] text-white rounded hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isExecuting ? 'Executing...' : 'Execute Query'}
          </button>
          {onSaveSearch && (
            <button
              onClick={handleSaveSearch}
              disabled={!query.trim()}
              className="px-4 py-2 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded hover:bg-[#0d1117] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Save Search
            </button>
          )}
          <button
            onClick={() => setQuery('')}
            className="px-4 py-2 bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded hover:bg-[#0d1117] text-sm"
          >
            Clear
          </button>
        </div>

        {/* Query Results */}
        {currentResult && (
          <div className="mt-4 p-4 bg-[#161b22] border border-[#30363d] rounded">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-[#c9d1d9]">
                <span className="font-semibold">{currentResult.eventCount.toLocaleString()}</span> events found
                <span className="text-[#8b949e] ml-4">
                  Execution time: {currentResult.executionTime}ms
                </span>
              </div>
              {currentResult.fieldsScanned.length > 0 && (
                <div className="text-xs text-[#8b949e]">
                  Scanned: {currentResult.fieldsScanned.join(', ')}
                </div>
              )}
            </div>

            {/* Event List */}
            {currentResult.events.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentResult.events.slice(0, 100).map((event, idx) => (
                  <div
                    key={event.id || idx}
                    className="p-3 bg-[#0d1117] border border-[#30363d] rounded text-xs font-mono"
                  >
                    <div className="text-[#8b949e] mb-1">
                      {new Date(event.timestamp).toLocaleString()} • {event.source} • {event.technique_id || 'N/A'}
                    </div>
                    <pre className="text-[#c9d1d9] whitespace-pre-wrap break-words">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </div>
                ))}
                {currentResult.events.length > 100 && (
                  <div className="text-center py-2 text-xs text-[#8b949e]">
                    Showing first 100 of {currentResult.eventCount.toLocaleString()} events
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Query History */}
      {queryHistory.length > 0 && (
        <div className="siem-card">
          <h4 className="text-sm font-semibold text-[#c9d1d9] mb-3">Query History</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {queryHistory.slice(0, 10).map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-[#0d1117] border border-[#30363d] rounded cursor-pointer hover:border-[#58a6ff]/50"
                onClick={() => {
                  setQuery(entry.query);
                  setSyntax(entry.syntax);
                  if (entry.results) {
                    setCurrentResult(entry.results);
                  }
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#8b949e] font-mono">{entry.query}</span>
                  <span className="text-xs text-[#8b949e]">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {entry.results && (
                  <div className="text-xs text-[#8b949e]">
                    {entry.results.eventCount} events • {entry.results.executionTime}ms
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


