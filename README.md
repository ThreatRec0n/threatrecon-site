# ThreatRecon Labs

**Single-player AI-driven cyber range where you practice as an attacker or defender.**

## Branch Information

- **`main`**: Legacy ThreatRecon Breach Drill Platform (preserved for rollback reference)
- **`labs-migration`**: Production branch - Single-player AI cyber range replacing the legacy site on threatrecon.io when stable

## Current Status

ThreatRecon Labs is a fully playable, single-player AI cyber range with:
- **Attacker mode**: Break in, pivot laterally, exfiltrate data, avoid detection
- **Defender mode**: Monitor traffic, detect intrusions, collect evidence, contain threats
- **AI opponent**: Reacts to your actions with realistic defensive/offensive responses
- **Terminal-based UI**: Realistic CLI experience (Linux-style for attacker, PowerShell for defender)
- **After Action Reports**: Complete timeline, findings, and recommendations at match end

**No multiplayer. No placeholders. Fully playable start-to-finish with AAR generation.**

## 🎯 **What This Is**

ThreatRecon Drill Platform is a comprehensive breach simulation engine that runs full incident response war rooms in the browser. It captures authoritative incident timelines, scores team readiness across multiple axes, and produces regulatory/compliance artifacts that turn tabletop exercises into auditable remediation and training records.

## 🏗️ **Core Product Pillars**

### **Scenario Engine**
- High-fidelity, branching, conditional injects with timed and event-driven triggers
- Adjustable difficulty with noise injection and ambiguity controls
- Randomization seeds to prevent replay memorization

### **Realtime Orchestration**
- Server-driven injects via WebSockets
- Role-targeted channels and response capture
- Facilitator console with pause, inject-now, rollback, and escalation controls

### **Decision & Evidence Capture**
- Structured decision objects with timestamps and parameters
- Chain-of-custody records and attachment placeholders
- Immutable audit trails for legal defensibility

### **Multi-Axis Scoring & Maturity Model**
- Technical Response (TR), Legal/Compliance (LC), Communication (CM)
- Executive Decision (EX), Business Continuity (BC/DR)
- Weighted metrics, baselines, and trend tracking

### **After Action Report (AAR)**
- Automated PDF + JSON + Markdown generation
- Remediation tasks with role assignments
- CI-friendly artifacts and exportable timelines

### **Scenario Editor & Marketplace**
- GUI editor for custom scenarios
- Shareable scenario packs (free & paid)
- Industry-specific content (healthcare, finance, government)

## 🎮 **Three Operating Modes**

### **Mode A: Team Readiness Drill**
- **Audience**: Internal blue team / IT / security orgs
- **Purpose**: Tabletop simulation training with full audit log
- **Value**: Audit-proof incident response practice

### **Mode B: Classroom Exercise**
- **Audience**: Colleges, bootcamps, security clubs
- **Purpose**: Instructor-led scenarios with live injects and scoring
- **Value**: Repeatable, graded exercises with participation proof

### **Mode C: Consultant / MSSP Delivery**
- **Audience**: Consultants and IR firms running client drills
- **Purpose**: Facilitate drills and deliver PDF binders
- **Value**: Immediate commercial traction and professional deliverables

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js >= 18.0.0
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### **Local Development**
```bash
# Clone and install
git clone https://github.com/threatrecon/drill-platform.git
cd drill-platform
npm install

# Start development environment
npm run docker:dev

# Or run locally
npm run dev
```

### **Production Deployment**
```bash
# Docker Compose deployment
npm run docker:prod

# Or traditional deployment
npm run build
npm start
```

## 📁 **Project Structure**

```
├── src/
│   ├── backend/          # Express.js API server
│   │   ├── services/     # Core business logic
│   │   ├── routes/       # API endpoints
│   │   ├── models/       # Database models
│   │   └── workers/      # Background job processing
│   ├── frontend/         # Next.js React application
│   │   ├── pages/        # Application pages
│   │   ├── components/   # Reusable UI components
│   │   └── hooks/        # Custom React hooks
│   └── shared/           # Shared types and utilities
├── scenarios/            # Scenario JSON files
├── templates/           # AAR export templates
├── docker/              # Docker configuration
└── docs/                # Documentation
```

## 🔒 **Security & Privacy**

### **IMPORTANT: Public SaaS Safety Rules**

**Do not enter real personal data, regulated data, PHI, or production secrets in the hosted service.**

- **Hosted drills auto-delete after SESSION_RETENTION_DAYS (default: 7 days)**
- **You can purge a drill at any time using the "Delete Drill Now" button**
- **All facilitator actions are logged and included in the signed AAR**
- **If you need to run a drill using real names, actual escalation paths, or live communications structure, deploy ThreatRecon on-prem using the Docker Compose bundle**

### **No PII Policy**
- **Public SaaS**: Explicitly discourages real names, internal systems
- **On-Premise**: Supports real organizational data with proper controls
- **Audit Logging**: Immutable timelines for legal defensibility

### **Compliance Ready**
- SOC2, ISO27001, NIST 800-61 alignment
- GDPR/CCPA data retention and deletion
- Cryptographic AAR signing for tamper-proofing

## 🎯 **Target Users**

1. **Educational Institutions** - Graded drills and transcripts
2. **SMB/Mid-Market** - Compliance tests and tabletop exercises  
3. **Security Clubs** - Reusable training scenarios
4. **SOC Teams & MSSPs** - Internal red/blue practice
5. **IR Consultants** - Professional client deliverables

## 📊 **Success Metrics**

- **Usage**: Completed drills per week, AAR exports generated
- **Training Impact**: Time to escalate, evidence preservation rates
- **Adoption**: Unique organizations, custom scenario creation
- **Monetization**: Self-host conversions, scenario pack downloads

## 🛠️ **Technology Stack**

- **Frontend**: Next.js (React + TypeScript) + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Realtime**: Socket.io for WebSocket communication
- **Queue**: Redis + BullMQ for job processing
- **Database**: PostgreSQL for persistence
- **PDF Generation**: Puppeteer with headless Chromium
- **Deployment**: Docker Compose for containerization

## 📈 **Roadmap**

### **Phase 1 (MVP)** - 2-4 weeks
- Core scenario engine with timed injects
- Realtime session capture and AAR export
- Basic scoring and facilitator controls

### **Phase 2** - 1-2 months  
- Scenario editor and marketplace skeleton
- Scheduled drills and team operations
- Docker deployment and CI/CD

### **Phase 3** - 2-3 months
- Integrations (ticketing, calendar, SIEM)
- Plugin SDK and certification mode
- Enterprise features (SAML, multi-tenant)

### **Phase 4** - Ongoing
- Scenario marketplace with paid tiers
- Advanced AI-assisted scenario generation
- Government/FedRAMP compliance

## 💰 **Monetization**

- **Free Tier**: Public drills with ThreatRecon branding
- **Pro**: Custom scenarios, private storage, custom branding
- **Enterprise**: SSO, on-premise, audit retention, white-label
- **Marketplace**: Industry-specific scenario packs
- **Certification**: Proctored exams and verified badges

## 🤝 **Contributing**

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

## 🆘 **Support**

- **Documentation**: [docs.threatrecon.io](https://docs.threatrecon.io)
- **Issues**: [GitHub Issues](https://github.com/threatrecon/drill-platform/issues)
- **Security**: [security@threatrecon.io](mailto:security@threatrecon.io)

---

**ThreatRecon Drill Platform** - Transforming incident response training from chaos to clarity. 
 