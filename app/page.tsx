import LogViewer from '@/components/LogViewer';

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Log Analysis</h1>
            <p className="text-[#8b949e]">Analyze security logs in real-time with pre-loaded sample data</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="w-2 h-2 rounded-full bg-[#3fb950]"></div>
            <span className="text-sm text-[#8b949e]">Sample Data Loaded</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="siem-card">
          <div className="text-sm text-[#8b949e] mb-1">Pre-loaded Logs</div>
          <div className="text-2xl font-semibold text-[#c9d1d9]">Zeek + Suricata</div>
          <div className="text-xs text-[#8b949e] mt-1">Ready to analyze</div>
        </div>
        <div className="siem-card">
          <div className="text-sm text-[#8b949e] mb-1">Supported Formats</div>
          <div className="text-2xl font-semibold text-[#c9d1d9]">JSONL, CSV, JSON</div>
          <div className="text-xs text-[#8b949e] mt-1">Upload custom files</div>
        </div>
        <div className="siem-card">
          <div className="text-sm text-[#8b949e] mb-1">Max Display</div>
          <div className="text-2xl font-semibold text-[#c9d1d9]">500 Rows</div>
          <div className="text-xs text-[#8b949e] mt-1">Per view</div>
        </div>
      </div>

      {/* Main Log Viewer */}
      <div className="siem-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#c9d1d9]">Event Log Viewer</h2>
          <div className="flex items-center gap-2">
            <div className="text-xs text-[#8b949e]">
              Professional SIEM Interface
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950]"></div>
          </div>
        </div>
        <LogViewer />
      </div>

      {/* Info Card */}
      <div className="siem-card border-l-4 border-[#58a6ff]">
        <h3 className="text-sm font-semibold text-[#c9d1d9] mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>About the Sample Data</span>
        </h3>
        <div className="text-sm text-[#8b949e] space-y-2">
          <p>The log viewer is pre-loaded with sample security logs:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><code className="px-1.5 py-0.5 bg-[#0d1117] rounded text-[#58a6ff]">zeek_conn_small.jsonl</code> - Zeek network connection logs showing periodic beaconing behavior</li>
            <li><code className="px-1.5 py-0.5 bg-[#0d1117] rounded text-[#58a6ff]">suricata_alerts_small.jsonl</code> - Suricata IDS alerts for FTP data exfiltration attempts</li>
          </ul>
          <p className="pt-2 text-xs text-[#484f58]">
            You can upload your own log files using the "Upload Custom" button, or continue analyzing the pre-loaded sample data.
          </p>
        </div>
      </div>
    </div>
  );
}
