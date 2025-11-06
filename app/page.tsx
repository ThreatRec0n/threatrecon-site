import SIEMDashboard from '@/components/SIEMDashboard';

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#c9d1d9] mb-2">Security Operations Center</h1>
            <p className="text-[#8b949e]">Real-time threat detection and incident response</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border border-[#30363d] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></div>
              <span className="text-sm text-[#8b949e]">System Operational</span>
            </div>
            <div className="text-xs text-[#8b949e]">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main SIEM Dashboard */}
      <SIEMDashboard />
    </div>
  );
}
