// Comprehensive IOC extraction from simulated events
// Handles multiple log sources, formats, and extraction methods

import type { SimulatedEvent } from './simulation-engine/core-types';

export interface ExtractedIOCs {
  ips: string[];
  domains: string[];
  hashes: string[];
  pids: string[];
}

// IP address regex (IPv4)
const IP_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

// Domain regex (basic)
const DOMAIN_REGEX = /\b([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b/g;

// Hash regexes (MD5, SHA1, SHA256)
const MD5_REGEX = /\b[a-fA-F0-9]{32}\b/g;
const SHA1_REGEX = /\b[a-fA-F0-9]{40}\b/g;
const SHA256_REGEX = /\b[a-fA-F0-9]{64}\b/g;

// PID regex (numeric)
const PID_REGEX = /\b\d{3,6}\b/g;

// Private IP ranges to exclude
const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^127\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^255\.255\.255\.255$/,
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pattern => pattern.test(ip));
}

function isValidIP(ip: string): boolean {
  return IP_REGEX.test(ip) && !isPrivateIP(ip);
}

function isValidDomain(domain: string): boolean {
  // Exclude common benign domains and localhost
  const excludePatterns = [
    /^localhost$/i,
    /^127\.0\.0\.1$/,
    /\.local$/i,
    /^[0-9]+$/,
  ];
  
  if (excludePatterns.some(p => p.test(domain))) return false;
  if (domain.length < 4 || domain.length > 255) return false;
  if (domain.split('.').length < 2) return false;
  
  return DOMAIN_REGEX.test(domain);
}

function isValidHash(hash: string): boolean {
  // Must be MD5 (32), SHA1 (40), or SHA256 (64) hex characters
  return (hash.length === 32 && MD5_REGEX.test(hash)) ||
         (hash.length === 40 && SHA1_REGEX.test(hash)) ||
         (hash.length === 64 && SHA256_REGEX.test(hash));
}

function isValidPID(pid: string): boolean {
  // PIDs are typically 4-6 digits, exclude very small numbers
  const num = parseInt(pid, 10);
  return !isNaN(num) && num >= 100 && num <= 999999;
}

/**
 * Extract IOCs from a single event using all available methods
 */
function extractIOCsFromEvent(event: SimulatedEvent): ExtractedIOCs {
  const ips = new Set<string>();
  const domains = new Set<string>();
  const hashes = new Set<string>();
  const pids = new Set<string>();

  // 1. Extract from network_context
  if (event.network_context) {
    const { source_ip, dest_ip } = event.network_context;
    
    if (source_ip && typeof source_ip === 'string' && isValidIP(source_ip)) {
      ips.add(source_ip);
    }
    if (dest_ip && typeof dest_ip === 'string' && isValidIP(dest_ip)) {
      ips.add(dest_ip);
    }
  }

  // 2. Extract from process_tree
  if (event.process_tree) {
    const { process_id, command_line } = event.process_tree;
    
    if (process_id && typeof process_id === 'string' && isValidPID(process_id)) {
      pids.add(process_id);
    }
    
    // Extract IOCs from command line
    if (command_line && typeof command_line === 'string') {
      // Extract IPs from command line
      const ipMatches = command_line.match(IP_REGEX);
      if (ipMatches) {
        ipMatches.forEach(ip => {
          if (isValidIP(ip)) ips.add(ip);
        });
      }
      
      // Extract domains from command line
      const domainMatches = command_line.match(DOMAIN_REGEX);
      if (domainMatches) {
        domainMatches.forEach(domain => {
          if (isValidDomain(domain)) domains.add(domain.toLowerCase());
        });
      }
      
      // Extract hashes from command line
      const hashMatches = command_line.match(/(?:MD5|SHA1|SHA256)[=:]\s*([a-fA-F0-9]{32,64})/i);
      if (hashMatches && hashMatches[1] && isValidHash(hashMatches[1])) {
        hashes.add(hashMatches[1].toLowerCase());
      }
    }
    
    // Recursively extract from children
    if (event.process_tree.children) {
      event.process_tree.children.forEach(child => {
        if (child.process_id && isValidPID(child.process_id)) {
          pids.add(child.process_id);
        }
      });
    }
  }

  // 3. Extract from details object (structured fields)
  if (event.details && typeof event.details === 'object') {
    // IP addresses
    const ipFields = [
      'DestinationIp', 'SourceIp', 'SrcIp', 'DstIp', 'SourceIP', 'DestinationIP',
      'src_ip', 'dst_ip', 'source_ip', 'dest_ip', 'client_ip', 'server_ip',
      'remote_ip', 'local_ip', 'ip', 'IP'
    ];
    
    ipFields.forEach(field => {
      const value = event.details[field];
      if (value && typeof value === 'string' && isValidIP(value)) {
        ips.add(value);
      }
    });

    // Domains
    const domainFields = [
      'QueryName', 'host', 'Host', 'hostname', 'Hostname', 'domain', 'Domain',
      'dns_query', 'query', 'server_name', 'serverName', 'url_host', 'uri_host'
    ];
    
    domainFields.forEach(field => {
      const value = event.details[field];
      if (value && typeof value === 'string' && isValidDomain(value)) {
        domains.add(value.toLowerCase());
      }
    });

    // Hashes
    const hashFields = ['Hash', 'Hashes', 'hash', 'file_hash', 'FileHash', 'md5', 'MD5', 'sha1', 'SHA1', 'sha256', 'SHA256'];
    
    hashFields.forEach(field => {
      const value = event.details[field];
      if (value) {
        if (typeof value === 'string') {
          // Check if it's a hash string
          if (isValidHash(value)) {
            hashes.add(value.toLowerCase());
          } else {
            // Try to extract hash from format like "SHA256=abc123..."
            const hashMatch = value.match(/(?:SHA256|SHA1|MD5)[=:]\s*([a-fA-F0-9]{32,64})/i);
            if (hashMatch && hashMatch[1] && isValidHash(hashMatch[1])) {
              hashes.add(hashMatch[1].toLowerCase());
            }
          }
        } else if (typeof value === 'object') {
          // Handle Hashes object like { MD5: "...", SHA256: "..." }
          Object.values(value).forEach(hashVal => {
            if (typeof hashVal === 'string' && isValidHash(hashVal)) {
              hashes.add(hashVal.toLowerCase());
            }
          });
        }
      }
    });

    // PIDs
    const pidFields = ['ProcessId', 'process_id', 'ProcessID', 'pid', 'PID', 'ParentProcessId', 'parent_process_id'];
    
    pidFields.forEach(field => {
      const value = event.details[field];
      if (value) {
        const pidStr = String(value);
        if (isValidPID(pidStr)) {
          pids.add(pidStr);
        }
      }
    });

    // Extract from URL fields
    const urlFields = ['url', 'URL', 'uri', 'URI', 'request_uri', 'path'];
    urlFields.forEach(field => {
      const value = event.details[field];
      if (value && typeof value === 'string') {
        try {
          const url = new URL(value);
          if (url.hostname && isValidDomain(url.hostname)) {
            domains.add(url.hostname.toLowerCase());
          }
        } catch {
          // Not a valid URL, try regex extraction
          const domainMatch = value.match(DOMAIN_REGEX);
          if (domainMatch) {
            domainMatch.forEach(domain => {
              if (isValidDomain(domain)) domains.add(domain.toLowerCase());
            });
          }
        }
      }
    });
  }

  // 4. Extract from log message (fallback regex-based extraction)
  // Check if there's a message field or if we need to stringify the event
  const messageFields = ['message', 'Message', 'log_message', 'LogMessage', 'description', 'Description'];
  
  let logMessage = '';
  if (event.details) {
    for (const field of messageFields) {
      if (event.details[field] && typeof event.details[field] === 'string') {
        logMessage = event.details[field];
        break;
      }
    }
  }
  
  // If no message field, stringify the entire event for regex scanning
  if (!logMessage) {
    logMessage = JSON.stringify(event);
  }

  // Extract IPs from message
  const ipMatches = logMessage.match(IP_REGEX);
  if (ipMatches) {
    ipMatches.forEach(ip => {
      if (isValidIP(ip)) ips.add(ip);
    });
  }

  // Extract domains from message
  const domainMatches = logMessage.match(DOMAIN_REGEX);
  if (domainMatches) {
    domainMatches.forEach(domain => {
      if (isValidDomain(domain)) domains.add(domain.toLowerCase());
    });
  }

  // Extract hashes from message
  const hashPatterns = [
    MD5_REGEX,
    SHA1_REGEX,
    SHA256_REGEX,
    /(?:MD5|SHA1|SHA256)[=:]\s*([a-fA-F0-9]{32,64})/gi,
  ];
  
  hashPatterns.forEach(pattern => {
    const matches = logMessage.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Extract hash from match (handle "SHA256=abc123" format)
        const hash = match.includes('=') ? match.split('=')[1]?.trim() : match;
        if (hash && isValidHash(hash)) {
          hashes.add(hash.toLowerCase());
        }
      });
    }
  });

  // Extract PIDs from message (be careful not to match timestamps or other numbers)
  const pidMatches = logMessage.match(/\b(?:PID|ProcessId|process_id)[=:]\s*(\d{3,6})\b/gi);
  if (pidMatches) {
    pidMatches.forEach(match => {
      const pidMatch = match.match(/\d{3,6}/);
      if (pidMatch && isValidPID(pidMatch[0])) {
        pids.add(pidMatch[0]);
      }
    });
  }

  return {
    ips: Array.from(ips).sort(),
    domains: Array.from(domains).sort(),
    hashes: Array.from(hashes).sort(),
    pids: Array.from(pids).sort(),
  };
}

/**
 * Extract all IOCs from a session's events
 * Deduplicates and returns sorted arrays
 */
export function extractIOCsFromEvents(events: SimulatedEvent[]): ExtractedIOCs {
  const allIps = new Set<string>();
  const allDomains = new Set<string>();
  const allHashes = new Set<string>();
  const allPids = new Set<string>();

  // Extract IOCs from each event
  events.forEach(event => {
    const eventIOCs = extractIOCsFromEvent(event);
    
    eventIOCs.ips.forEach(ip => allIps.add(ip));
    eventIOCs.domains.forEach(domain => allDomains.add(domain));
    eventIOCs.hashes.forEach(hash => allHashes.add(hash));
    eventIOCs.pids.forEach(pid => allPids.add(pid));
  });

  return {
    ips: Array.from(allIps).sort(),
    domains: Array.from(allDomains).sort(),
    hashes: Array.from(allHashes).sort(),
    pids: Array.from(allPids).sort(),
  };
}

