import fs from 'node:fs';
import path from 'node:path';
import ScenarioCard from '@/components/ScenarioCard';
import ScenarioRunner from '@/components/ScenarioRunner';

type Scenario = {
  id: string;
  title: string;
  summary: string;
  objectives: string[];
  datasetHints: string[];
};

function loadScenarios(): Scenario[] {
  try {
    const dir = path.join(process.cwd(), 'data', 'scenarios');
    if (!fs.existsSync(dir)) {
      console.warn('Scenarios directory not found');
      return [];
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    return files.map(f => {
      try {
        const raw = fs.readFileSync(path.join(dir, f), 'utf8');
        return JSON.parse(raw) as Scenario;
      } catch (error) {
        console.error(`Error loading scenario ${f}:`, error);
        return null;
      }
    }).filter((s): s is Scenario => s !== null);
  } catch (error) {
    console.error('Error loading scenarios:', error);
    return [];
  }
}

export default function ScenariosPage() {
  const scenarios = loadScenarios();
  
  if (scenarios.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-[#c9d1d9]">Threat Hunting Scenarios</h1>
          <p className="text-[#8b949e]">Practice real-world threat investigation scenarios</p>
        </div>
        <div className="siem-card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-[#8b949e] mb-2">No scenarios available</p>
          <p className="text-sm text-[#484f58]">Check the data/scenarios directory for scenario files</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Threat Hunting Scenarios</h1>
            <p className="text-[#8b949e]">Practice real-world threat investigation scenarios with realistic log data</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg">
            <span className="text-sm text-[#8b949e]">{scenarios.length}</span>
            <span className="text-xs text-[#484f58]">|</span>
            <span className="text-sm text-[#8b949e]">Scenarios Available</span>
          </div>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {scenarios.map(sc => (
          <article key={sc.id} className="siem-card">
            <ScenarioCard scenario={sc} />
            <ScenarioRunner scenario={sc} />
          </article>
        ))}
      </div>
    </div>
  );
}
