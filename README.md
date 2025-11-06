# Threat Hunt Lab

A hands-on threat hunting platform for analyzing security logs and practicing investigation scenarios.

## Features

- **Interactive Log Viewer**: Upload and analyze JSONL, CSV, and JSON log files
- **Scenario-Based Training**: Practice threat hunting with curated scenarios
- **Real-time Filtering**: Search and filter logs by keywords, IPs, signatures, etc.
- **Sample Datasets**: Included Zeek and Suricata log samples for practice

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
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home page with log viewer
│   ├── scenarios/
│   │   └── page.tsx        # Scenarios listing page
│   └── styles/
│       └── globals.css     # Global styles
├── components/
│   ├── LogViewer.tsx       # Interactive log analysis component
│   ├── ScenarioCard.tsx   # Scenario display component
│   └── ScenarioRunner.tsx  # Scenario question/answer component
├── data/
│   └── scenarios/          # Scenario definitions (JSON)
├── lib/
│   └── parsers/            # Log parsing utilities
└── public/
    └── sample/             # Sample log files
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
