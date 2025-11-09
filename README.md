# ThreatRecon SOC Training Platform

An advanced, hands-on threat hunting and SOC simulation platform for training security analysts. Built with realistic attack chains, multi-source log analysis, and professional SOC workflows.

**🎯 The Ultimate Free Hands-On Threat Hunting Lab** - This platform implements the comprehensive blueprint for a free, open-access threat hunting training environment. No login required, no cost, maximum learning value.

## Features

- **SOC Simulation Dashboard**: Professional-grade threat hunting interface with multi-stage attack scenarios
- **MITRE ATT&CK Integration**: Full technique mapping and visualization
- **Purple Team Mode**: Execute Atomic Red Team techniques and test detection rules
- **Detection Rule Builder**: Create and test Sigma, YARA, KQL, and Splunk rules
- **IOC Tagging & Enrichment**: Tag and enrich indicators with threat intelligence
- **Learning Mode**: Educational overlays with MITRE explanations and detection guidance
- **Evaluation Engine**: Comprehensive scoring and feedback system
- **Multi-Source Log Analysis**: Sysmon, Zeek, Suricata, and EDR logs

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- PapaParse (CSV parsing)
- Vercel-ready deployment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (redirects to /simulation)
│   ├── simulation/
│   │   └── page.tsx            # SOC Simulation Dashboard
│   └── api/
│       └── simulation/        # Simulation engine API
├── components/
│   ├── soc-dashboard/          # SOC dashboard components
│   │   ├── SimulationDashboard.tsx
│   │   ├── LogExplorer.tsx
│   │   ├── IOCTaggingPanel.tsx
│   │   ├── TimelinePanel.tsx
│   │   ├── MitreNavigator.tsx
│   │   ├── PurpleTeamMode.tsx
│   │   └── EvaluationReport.tsx
│   └── DetectionRuleBuilder.tsx
├── lib/
│   ├── simulation-engine/     # Core simulation engine
│   ├── evaluation-engine/      # Investigation scoring
│   ├── log-generators/        # Log generation (Sysmon, Zeek)
│   └── attack-simulators/     # Atomic Red Team execution
└── public/
```

## Adding Scenarios

Create JSON files in `data/scenarios/` with this structure:

```json
{
  "id": "scenario-id",
  "title": "Scenario Title",
  "summary": "Brief description",
  "objectives": ["Objective 1", "Objective 2"],
  "datasetHints": ["Hint 1", "Hint 2"]
}
```

## Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Framework preset: **Next.js**
4. Leave all defaults and deploy

The `vercel.json` file is already configured for optimal deployment.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
