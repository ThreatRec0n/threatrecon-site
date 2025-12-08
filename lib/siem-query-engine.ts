// SIEM Query Engine - Executes SPL/KQL/ELK queries against event data

import type { SimulatedEvent } from './simulation-engine/core-types';

export interface QueryResult {
  eventCount: number;
  events: SimulatedEvent[];
  executionTime: number;
  fieldsScanned: string[];
}

export type QuerySyntax = 'SPL' | 'KQL' | 'ELK';

// Simple query parser and executor
export function executeQuery(
  query: string,
  syntax: QuerySyntax,
  events: SimulatedEvent[]
): QueryResult {
  const startTime = performance.now();
  const fieldsScanned: Set<string> = new Set();
  
  let filteredEvents: SimulatedEvent[] = [...events];
  
  try {
    switch (syntax) {
      case 'SPL':
        filteredEvents = executeSPLQuery(query, events, fieldsScanned);
        break;
      case 'KQL':
        filteredEvents = executeKQLQuery(query, events, fieldsScanned);
        break;
      case 'ELK':
        filteredEvents = executeELKQuery(query, events, fieldsScanned);
        break;
    }
  } catch (error) {
    console.error('Query execution error:', error);
    return {
      eventCount: 0,
      events: [],
      executionTime: performance.now() - startTime,
      fieldsScanned: [],
    };
  }
  
  const executionTime = Math.round(performance.now() - startTime);
  
  return {
    eventCount: filteredEvents.length,
    events: filteredEvents.slice(0, 1000), // Limit results for performance
    executionTime,
    fieldsScanned: Array.from(fieldsScanned),
  };
}

function executeSPLQuery(query: string, events: SimulatedEvent[], fieldsScanned: Set<string>): SimulatedEvent[] {
  let filtered = [...events];
  
  // Parse basic SPL syntax
  const parts = query.toLowerCase().split('|').map(p => p.trim());
  
  for (const part of parts) {
    // Field filters: source=sysmon, EventID=1, etc.
    if (part.includes('=')) {
      const filters = part.split(/\s+/).filter(f => f.includes('='));
      
      for (const filter of filters) {
        const [field, value] = filter.split('=').map(s => s.trim());
        fieldsScanned.add(field);
        
        filtered = filtered.filter(event => {
          if (field === 'source') {
            return event.source.toLowerCase() === value.toLowerCase();
          }
          
          // Check in details
          const detailValue = getNestedValue(event.details, field);
          if (detailValue === null || detailValue === undefined) return false;
          
          const detailStr = String(detailValue).toLowerCase();
          return detailStr.includes(value.toLowerCase()) || detailStr === value.toLowerCase();
        });
      }
    }
    
    // WHERE clause
    if (part.startsWith('where')) {
      const conditions = part.replace('where', '').trim();
      filtered = applyWhereConditions(conditions, filtered, fieldsScanned);
    }
    
    // STATS command
    if (part.startsWith('stats')) {
      // For now, just return filtered events
      // In a real implementation, would aggregate
      break;
    }
    
    // TIMECHART command
    if (part.startsWith('timechart')) {
      // For now, just return filtered events
      break;
    }
  }
  
  return filtered;
}

function executeKQLQuery(query: string, events: SimulatedEvent[], fieldsScanned: Set<string>): SimulatedEvent[] {
  let filtered = [...events];
  
  // Parse basic KQL syntax
  const whereMatch = query.match(/where\s+(.+?)(?:\s+\|)/i);
  if (whereMatch) {
    const conditions = whereMatch[1];
    filtered = applyWhereConditions(conditions, filtered, fieldsScanned);
  }
  
  return filtered;
}

function executeELKQuery(query: string, events: SimulatedEvent[], fieldsScanned: Set<string>): SimulatedEvent[] {
  let filtered = [...events];
  
  // Parse basic ELK syntax
  const conditions = query.split(/\s+(AND|OR|NOT)\s+/i);
  
  let currentFiltered = filtered;
  let operator: 'AND' | 'OR' | 'NOT' = 'AND';
  
  for (const condition of conditions) {
    if (['AND', 'OR', 'NOT'].includes(condition.toUpperCase())) {
      operator = condition.toUpperCase() as 'AND' | 'OR' | 'NOT';
      continue;
    }
    
    // Field:value syntax
    if (condition.includes(':')) {
      const [field, value] = condition.split(':').map(s => s.trim());
      fieldsScanned.add(field);
      
      const conditionFiltered = filtered.filter(event => {
        if (field === 'source') {
          return event.source.toLowerCase() === value.toLowerCase();
        }
        
        const detailValue = getNestedValue(event.details, field);
        if (detailValue === null || detailValue === undefined) return false;
        
        const detailStr = String(detailValue).toLowerCase();
        
        // Handle operators
        if (value.startsWith('>')) {
          const num = parseFloat(value.substring(1));
          return parseFloat(detailStr) > num;
        }
        if (value.startsWith('<')) {
          const num = parseFloat(value.substring(1));
          return parseFloat(detailStr) < num;
        }
        if (value.includes('*')) {
          const pattern = value.replace(/\*/g, '.*');
          return new RegExp(pattern, 'i').test(detailStr);
        }
        
        return detailStr.includes(value.toLowerCase());
      });
      
      if (operator === 'AND') {
        currentFiltered = currentFiltered.filter(e => conditionFiltered.includes(e));
      } else if (operator === 'OR') {
        currentFiltered = [...new Set([...currentFiltered, ...conditionFiltered])];
      } else if (operator === 'NOT') {
        currentFiltered = currentFiltered.filter(e => !conditionFiltered.includes(e));
      }
    }
  }
  
  return currentFiltered;
}

function applyWhereConditions(conditions: string, events: SimulatedEvent[], fieldsScanned: Set<string>): SimulatedEvent[] {
  // Simple condition parser
  const andConditions = conditions.split(/\s+and\s+/i);
  const orConditions = conditions.split(/\s+or\s+/i);
  
  if (orConditions.length > 1) {
    // OR conditions
    return events.filter(event => {
      return orConditions.some(condition => matchesCondition(condition, event, fieldsScanned));
    });
  } else {
    // AND conditions
    return events.filter(event => {
      return andConditions.every(condition => matchesCondition(condition, event, fieldsScanned));
    });
  }
}

function matchesCondition(condition: string, event: SimulatedEvent, fieldsScanned: Set<string>): boolean {
  // Contains check
  if (condition.includes('contains')) {
    const match = condition.match(/(\w+)\s+contains\s+["'](.+?)["']/i);
    if (match) {
      const [, field, value] = match;
      fieldsScanned.add(field);
      const detailValue = getNestedValue(event.details, field);
      return detailValue ? String(detailValue).toLowerCase().includes(value.toLowerCase()) : false;
    }
  }
  
  // Equality check
  if (condition.includes('==') || condition.includes('=')) {
    const [field, value] = condition.split(/==?/).map(s => s.trim().replace(/["']/g, ''));
    fieldsScanned.add(field);
    const detailValue = getNestedValue(event.details, field);
    return detailValue ? String(detailValue).toLowerCase() === value.toLowerCase() : false;
  }
  
  // Comparison operators
  if (condition.includes('>') || condition.includes('<')) {
    const match = condition.match(/(\w+)\s*([><=]+)\s*(\d+)/);
    if (match) {
      const [, field, operator, numStr] = match;
      fieldsScanned.add(field);
      const detailValue = getNestedValue(event.details, field);
      const num = parseFloat(numStr);
      const value = parseFloat(String(detailValue));
      
      if (isNaN(value)) return false;
      
      switch (operator) {
        case '>': return value > num;
        case '<': return value < num;
        case '>=': return value >= num;
        case '<=': return value <= num;
        default: return false;
      }
    }
  }
  
  return false;
}

function getNestedValue(obj: any, path: string): any {
  // Handle nested paths like EventData.Image
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return null;
    
    // Try camelCase, PascalCase, and lowercase
    const keys = [
      part,
      part.charAt(0).toUpperCase() + part.slice(1),
      part.toLowerCase(),
      part.toUpperCase(),
    ];
    
    let found = false;
    for (const key of keys) {
      if (key in current) {
        current = current[key];
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Try case-insensitive search
      const lowerPart = part.toLowerCase();
      for (const key in current) {
        if (key.toLowerCase() === lowerPart) {
          current = current[key];
          found = true;
          break;
        }
      }
    }
    
    if (!found) return null;
  }
  
  return current;
}


