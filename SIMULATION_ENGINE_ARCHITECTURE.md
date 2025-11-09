# SOC Simulation Engine Architecture

## Overview

This document describes the complete refactoring of the threat hunting platform from a basic log tagging tool into a **SOC-grade simulation training system** modeled after RedHunt OS and Security Onion.

## Core Architecture

### 1. Simulation Engine (`lib/simulation-engine/`)

The simulation engine is the heart of the system, orchestrating attack generation, log correlation, and detection.

#### Components:

- **`types.ts`**: Core type definitions for events, attack chains, scenarios
- **`scenario-builder.ts`**: Generates multi-stage attack scenarios with story progression
- **`event-generator.ts`**: Creates correlated events across log sources (Sysmon, Zeek, etc.)
- **`detection-engine.ts`**: Evaluates events against detection rules and generates alerts
- **`index.ts`**: Main orchestrator class (`SimulationEngine`)

### 2. Key Features

#### Attack Chain Generation

The system generates realistic attack chains following MITRE ATT&CK:

- **Initial Access**: Phishing, USB, drive-by, etc.
- **Execution**: PowerShell, command execution
- **Persistence**: Registry keys, scheduled tasks
- **Privilege Escalation**: UAC bypass, token manipulation
- **Defense Evasion**: File deletion, process hollowing
- **Credential Access**: Credential dumping, keylogging
- **Discovery**: System enumeration, network scanning
- **Lateral Movement**: SMB, RDP, WMI
- **Collection**: Data staging, clipboard capture
- **Command & Control**: HTTP/HTTPS beaconing, DNS tunneling
- **Exfiltration**: Data transfer over network
- **Impact**: Ransomware, data destruction

#### Event Correlation

Events are linked across log sources:

- Same IP addresses across Sysmon and Zeek logs
- Process trees showing parent-child relationships
- Network context showing related connections
- Correlation keys for grouping related events

#### Detection Rules

Predefined detection rules (like Sigma rules) evaluate events:

- PowerShell encoded commands
- C2 beaconing patterns
- Credential dumping indicators
- Lateral movement attempts
- Large data exfiltration

### 3. Data Model

#### Enhanced Event Structure

```typescript
interface SimulatedEvent {
  id: string;
  source: 'sysmon' | 'zeek' | 'suricata' | 'edr';
  scenario_id: string;
  session_id: string;
  technique_id: string; // MITRE ATT&CK
  stage: AttackStage;
  timestamp: string;
  details: Record<string, any>;
  related_event_ids: string[];
  correlation_key?: string;
  process_tree?: ProcessTreeNode;
  network_context?: NetworkContext;
  threat_score: number; // 0-100
}
```

### 4. Scenario Generation

#### Story Templates

Predefined attack chain templates:

- **Ransomware Deployment**: Full ransomware attack flow
- **Credential Harvesting**: Steal credentials and lateral movement
- **APT Persistence**: Long-term persistence establishment

#### Dynamic Generation

- Multiple parallel or sequential scenarios
- Configurable difficulty levels
- Realistic timelines with delays between stages
- Noise injection (benign events)

### 5. API Integration

#### Endpoints (`app/api/simulation/route.ts`)

- `POST /api/simulation` with actions:
  - `initialize`: Start new simulation session
  - `get_events`: Retrieve filtered events
  - `get_related_events`: Get correlated events
  - `get_session`: Get current session state
  - `complete`: End simulation session

### 6. Frontend Integration (Next Steps)

The frontend needs to be updated to:

1. **Initialize simulations** via API
2. **Display events** in a realistic SOC dashboard
3. **Show correlations** between events
4. **Display attack chains** and progression
5. **Evaluate user performance** against detected IOCs

## Usage Example

```typescript
import { getSimulationEngine } from '@/lib/simulation-engine';

const engine = getSimulationEngine();

// Initialize a ransomware scenario
const session = engine.initializeSession({
  story_type: 'ransomware-deployment',
  difficulty: 'intermediate',
  hostname: 'WIN-WORKSTATION-01',
  username: 'DOMAIN\\user',
  sourceIP: '10.0.1.100',
  add_noise: true,
  noise_count: 100,
});

// Get all events
const allEvents = engine.getEvents();

// Get only high-threat events
const highThreatEvents = engine.getEvents({
  threat_score_min: 80,
});

// Get related events for correlation
const relatedEvents = engine.getRelatedEvents('event-123');

// Complete session
engine.completeSession();
```

## Next Steps

1. **Frontend Dashboard**: Build realistic SOC interface
2. **Timeline View**: Visualize attack progression
3. **Drill-Down**: Process trees, network context
4. **Alert Stack**: Dynamic alert generation
5. **Evaluation System**: Score IOC identification
6. **Learning Mode**: Educational overlays
7. **MITRE ATT&CK Matrix**: Visualize techniques
8. **Red Team View**: Show attacker perspective

## Benefits

- **Realistic**: Simulates actual SOC workflows
- **Educational**: Teaches real threat hunting skills
- **Scalable**: Supports multiple scenarios and difficulty levels
- **Correlated**: Events linked across log sources
- **Dynamic**: Generates unique scenarios each time
- **Comprehensive**: Covers full attack lifecycle

This architecture transforms the platform from a simple log viewer into a legitimate SOC training environment.

