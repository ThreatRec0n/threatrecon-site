# ThreatRecon Drill Platform - Developer Documentation

## 🚀 **Quick Start Guide**

### Prerequisites
- Node.js >= 18.0.0
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### Local Development Setup

1. **Clone and Install**
```bash
git clone https://github.com/threatrecon/drill-platform.git
cd drill-platform
npm install
```

2. **Start Development Environment**
```bash
# Using Docker Compose (Recommended)
npm run docker:dev

# Or run locally
npm run dev
```

3. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### First Drill

1. Navigate to http://localhost:3000
2. Click "Start Free Drill"
3. Select a scenario (e.g., "Ransomware Attack Simulation")
4. Assign roles to participants
5. Begin the drill and experience real-time injects

## 🏗️ **Architecture Overview**

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database     │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (PostgreSQL) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         │              │   Redis Cache   │             │
         │              │   & BullMQ      │             │
         │              └─────────────────┘             │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   WebSocket     │
                    │   (Socket.IO)   │
                    └─────────────────┘
```

### Key Services

- **ScenarioService**: Manages scenario loading, validation, and CRUD operations
- **SessionService**: Handles drill session lifecycle and participant management
- **OrchestrationService**: Manages real-time inject delivery and branching logic
- **ScoringService**: Calculates multi-axis scores and tracks performance
- **ExportService**: Generates AAR reports in multiple formats

## 📊 **Data Models**

### Core Entities

#### Scenario
```typescript
interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'low' | 'medium' | 'high';
  duration_minutes: number;
  roles: string[];
  injects: Inject[];
  branching_rules: BranchingRule[];
  end_conditions: EndCondition[];
  metadata: ScenarioMetadata;
  tenantId: string;
}
```

#### DrillSession
```typescript
interface DrillSession {
  id: string;
  scenarioId: string;
  tenantId: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  participants: Participant[];
  events: SessionEvent[];
  scores: SessionScores;
  facilitator: FacilitatorInfo;
  settings: SessionSettings;
}
```

#### Decision
```typescript
interface Decision {
  id: string;
  sessionId: string;
  role: string;
  action: string;
  parameters: Record<string, any>;
  rationale: string;
  timestamp: Date;
  evidence_refs?: string[];
  confidence?: number;
}
```

## 🎮 **Scenario Development**

### Scenario JSON Structure

```json
{
  "id": "unique_scenario_id",
  "title": "Scenario Title",
  "description": "Detailed description",
  "difficulty": "medium",
  "duration_minutes": 90,
  "roles": ["Incident Commander", "SOC Analyst", "Legal Counsel"],
  "injects": [
    {
      "id": "inject_001",
      "time_offset_minutes": 0,
      "type": "email",
      "target_roles": ["SOC Analyst"],
      "content": "URGENT: Security alert...",
      "severity": "critical",
      "required_actions": [
        {
          "role": "SOC Analyst",
          "action": "Immediately isolate affected systems",
          "timeout_minutes": 5,
          "penalty_points": 20
        }
      ],
      "scoring_impact": {
        "technical_response": 25,
        "executive_decision": 15
      }
    }
  ],
  "branching_rules": [
    {
      "id": "branch_001",
      "condition": "response.action == 'isolate'",
      "true_goto": "inject_002",
      "false_goto": "inject_003"
    }
  ],
  "end_conditions": [
    {
      "type": "time_elapsed",
      "minutes": 90
    }
  ]
}
```

### Inject Types

- **text**: Plain text message
- **sim_log**: Simulated log entry
- **email**: Email message with headers
- **siem**: SIEM alert format
- **file**: File attachment placeholder
- **manual**: Facilitator-controlled inject

### Branching Logic

Scenarios support conditional branching based on participant responses:

```json
{
  "condition": "response.action == 'isolate'",
  "true_goto": "inject_002",
  "false_goto": "inject_003",
  "timeout_goto": "inject_004",
  "timeout_minutes": 10
}
```

## 🎯 **Scoring System**

### Multi-Axis Scoring

The platform scores performance across five key areas:

1. **Technical Response (TR)**: Detection, containment, evidence preservation
2. **Legal/Compliance (LC)**: Regulatory notifications, legal review
3. **Communication (CM)**: Stakeholder communication, media response
4. **Executive Decision (EX)**: Strategic decisions, resource allocation
5. **Business Continuity (BC/DR)**: Continuity planning, recovery procedures

### Scoring Formula

```typescript
// Base score starts at 100
let axisScore = 100;

// Apply penalties for missed actions
for (const action of requiredActions) {
  if (!action.completed) {
    axisScore -= action.penalty_points;
  } else {
    axisScore += action.bonus_points || 0;
  }
}

// Apply time penalties
const timePenalty = Math.floor((responseTime - requiredTime) / granularity) * timePenaltyUnit;
axisScore -= timePenalty;

// Clamp to 0-100 range
axisScore = Math.max(0, Math.min(100, axisScore));
```

## 🔄 **Real-time Orchestration**

### WebSocket Events

The platform uses Socket.IO for real-time communication:

```typescript
// Client-side event handling
socket.on('inject-received', (inject) => {
  // Display inject to appropriate roles
});

socket.on('session-updated', (session) => {
  // Update session state
});

socket.on('decision-recorded', (data) => {
  // Show decision to all participants
});

// Server-side event emission
io.to(`session:${sessionId}`).emit('inject-received', inject);
```

### Inject Scheduling

Injects are scheduled using BullMQ with Redis:

```typescript
// Schedule timed inject
await injectQueue.add('process-inject', {
  sessionId,
  inject,
  scheduledTime: new Date(Date.now() + inject.time_offset_minutes * 60000)
}, {
  delay: inject.time_offset_minutes * 60000
});
```

## 📄 **After Action Report (AAR)**

### AAR Generation

AARs are generated using Puppeteer to create professional PDF reports:

```typescript
const aarContent = {
  executive_summary: generateExecutiveSummary(session),
  timeline: generateTimeline(session.events),
  decisions: generateDecisionSummary(session.decisions),
  scores: session.scores,
  gap_analysis: generateGapAnalysis(session),
  remediation_tasks: generateRemediationTasks(session),
  recommendations: generateRecommendations(session)
};

const pdfBuffer = await generatePDF(aarContent);
```

### Export Formats

- **PDF**: Professional report for executives and auditors
- **JSON**: Machine-readable format for integration
- **Markdown**: Human-readable format for documentation

## 🔒 **Security & Privacy**

### Multi-Tenant Architecture

The platform enforces strict tenant isolation:

```typescript
// All database queries include tenant filtering
const sessions = await db('sessions')
  .where('tenant_id', tenantId)
  .select('*');

// WebSocket namespaces are tenant-scoped
io.of(`/tenant:${tenantId}`).on('connection', (socket) => {
  // Tenant-specific logic
});
```

### Data Privacy

- **Public SaaS**: No PII allowed, role labels only
- **On-Premise**: Full control over data, supports real names
- **Audit Logging**: Immutable logs for compliance
- **Data Retention**: Configurable retention policies

## 🚀 **Deployment**

### Docker Compose (Recommended)

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/threatrecon

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### Production Considerations

- Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Use managed Redis (AWS ElastiCache, Redis Cloud)
- Configure SSL/TLS certificates
- Set up monitoring and logging
- Configure backup strategies

## 🧪 **Testing**

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   ├── utils/
│   └── models/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── scenarios/
    └── workflows/
```

## 🔧 **API Reference**

### Core Endpoints

#### Scenarios
- `GET /api/scenario` - List scenarios
- `GET /api/scenario/:id` - Get scenario details
- `POST /api/scenario` - Create scenario
- `PUT /api/scenario/:id` - Update scenario
- `DELETE /api/scenario/:id` - Delete scenario

#### Sessions
- `POST /api/session/start` - Start drill session
- `GET /api/session/:id` - Get session details
- `POST /api/session/:id/respond` - Record decision
- `POST /api/session/:id/facilitate` - Facilitator actions

#### Exports
- `POST /api/export/:id` - Generate AAR export
- `GET /api/export/:id/download` - Download export

### WebSocket Events

#### Client → Server
- `join-session` - Join drill session
- `decision` - Submit decision
- `leave-session` - Leave session

#### Server → Client
- `inject-received` - New inject delivered
- `session-updated` - Session state changed
- `decision-recorded` - Decision recorded
- `participant-joined` - Participant joined
- `session-ended` - Session completed

## 📚 **Additional Resources**

- [Scenario Development Guide](docs/scenario-development.md)
- [Scoring System Documentation](docs/scoring-system.md)
- [API Reference](docs/api-reference.md)
- [Deployment Guide](docs/deployment.md)
- [Security Guidelines](docs/security.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🆘 **Support**

- **Documentation**: [docs.threatrecon.io](https://docs.threatrecon.io)
- **Issues**: [GitHub Issues](https://github.com/threatrecon/drill-platform/issues)
- **Security**: [security@threatrecon.io](mailto:security@threatrecon.io)
- **Community**: [Discord Server](https://discord.gg/threatrecon)
