type Props = {
  scenario: {
    id: string;
    title: string;
    summary: string;
    objectives: string[];
    datasetHints: string[];
  };
};

export default function ScenarioCard({ scenario }: Props) {
  const objectives = Array.isArray(scenario?.objectives) ? scenario.objectives : [];
  const datasetHints = Array.isArray(scenario?.datasetHints) ? scenario.datasetHints : [];
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-semibold text-[#c9d1d9]">{scenario?.title ?? 'Untitled Scenario'}</h3>
        <span className="px-2.5 py-1 text-xs font-medium bg-[#161b22] border border-[#30363d] rounded text-[#8b949e]">
          Scenario
        </span>
      </div>
      
      <p className="text-[#8b949e] leading-relaxed">{scenario?.summary ?? ''}</p>
      
      <div className="space-y-3 pt-2 border-t border-[#30363d]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-[#c9d1d9]">Objectives</span>
            <span className="px-2 py-0.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#8b949e]">
              {objectives.length}
            </span>
          </div>
          <ul className="space-y-1.5">
            {(objectives ?? []).map((o, i) => (
              <li key={`obj-${i}`} className="flex items-start gap-2 text-sm text-[#8b949e]">
                <span className="text-[#58a6ff] mt-1">▸</span>
                <span>{String(o ?? '')}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-[#c9d1d9]">Dataset Hints</span>
            <span className="px-2 py-0.5 text-xs bg-[#0d1117] border border-[#30363d] rounded text-[#8b949e]">
              {datasetHints.length}
            </span>
          </div>
          <ul className="space-y-1.5">
            {(datasetHints ?? []).map((hint, i) => (
              <li key={`hint-${i}`} className="flex items-start gap-2 text-sm text-[#8b949e]">
                <span className="text-[#3fb950] mt-1">💡</span>
                <code className="px-1.5 py-0.5 bg-[#0d1117] rounded text-[#58a6ff] text-xs">{String(hint ?? '')}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
