import React, { useState } from 'react';

export default function SubmissionModal({ 
  isOpen, 
  onClose, 
  markedPackets, 
  onSubmit 
}) {
  const [selectedPacketId, setSelectedPacketId] = useState(markedPackets[0]?.id || '');
  const [technique, setTechnique] = useState('');
  const [explanation, setExplanation] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedPacketId || !technique || !explanation.trim()) {
      alert('Please fill in all fields.');
      return;
    }
    onSubmit({
      selectedPacketId,
      technique,
      explanation: explanation.trim(),
    });
    onClose();
  };

  const formatPacketLabel = (packet) => {
    if (!packet) return 'Unknown';
    const ts = typeof packet.ts === 'string' ? new Date(packet.ts) : new Date(packet.ts);
    const timeStr = ts.toISOString().split('T')[1].slice(0, 12);
    const proto = packet.proto || 'Unknown';
    const src = packet.layers?.ip?.srcIp || packet.src?.split(':')[0] || packet.src || '-';
    const dst = packet.layers?.ip?.dstIp || packet.dst?.split(':')[0] || packet.dst || '-';
    return `Packet #${packet.id}, ${timeStr}, ${proto}, ${src} → ${dst}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-terminal-green font-mono">SUBMIT FINDING</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-2xl leading-none">×</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Which marked packet is THE smoking gun? *
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {markedPackets.map((packet) => {
                if (!packet) return null;
                const pktId = packet.id;
                return (
                  <label key={pktId} className="flex items-center gap-2 p-2 bg-gray-800 rounded cursor-pointer hover:bg-gray-700">
                    <input
                      type="radio"
                      name="packet"
                      value={pktId}
                      checked={selectedPacketId === pktId}
                      onChange={(e) => setSelectedPacketId(e.target.value)}
                    />
                    <div className="flex-1 text-xs font-mono text-gray-300">
                      {formatPacketLabel(packet)}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Activity Type *
            </label>
            <select
              value={technique}
              onChange={(e) => setTechnique(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200"
            >
              <option value="">Select activity type...</option>
              <option value="data-exfiltration">Data Exfiltration</option>
              <option value="credential-theft">Credential Theft</option>
              <option value="beaconing">Beacon / C2</option>
              <option value="recon">Recon / Scan</option>
              <option value="lateral-movement">Lateral Movement</option>
              <option value="dns-tunneling">DNS Tunneling</option>
              <option value="other">Other / Not Sure</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-300 mb-2">
              Explain why this packet is admissible evidence of malicious activity. *
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="e.g. This HTTP POST contains multipart/form-data with filename payroll_q3.xlsx being sent to external IP 118.143.20.3..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm rounded-lg border border-green-400 py-2 font-mono transition-all"
            >
              SUBMIT
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm rounded-lg border border-gray-600 py-2 font-mono transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
