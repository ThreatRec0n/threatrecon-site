import React from 'react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-terminal-green font-mono">TRAINING GUIDE</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-6 text-gray-300 font-mono text-sm">
          <section>
            <h3 className="text-terminal-green font-semibold mb-2 text-base">How to Read Packets</h3>
            <ul className="list-disc list-inside space-y-1 text-[12px] ml-2">
              <li>Each packet represents a single network transaction</li>
              <li>Packet List shows: Time, Source, Destination, Protocol, Length, Info</li>
              <li>Click a packet to view decoded layers: Ethernet → IP → TCP/UDP → Application</li>
              <li>Hex view shows raw bytes; ASCII view shows readable text</li>
              <li>Use filters to narrow down suspects (ip==, port==, proto==, contains)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-2 text-base">Common Exfil Patterns</h3>
            <div className="space-y-3 text-[12px]">
              <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                <div className="text-yellow-400 font-semibold mb-1">HTTP POST Exfiltration</div>
                <div>Look for: multipart/form-data, large POST requests, unusual filenames in Content-Disposition headers</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                <div className="text-yellow-400 font-semibold mb-1">DNS Tunneling</div>
                <div>Look for: abnormally long domain names, base64-encoded subdomains, high DNS query volume</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
                <div className="text-yellow-400 font-semibold mb-1">Suspicious Ports</div>
                <div>Look for: non-standard ports (not 80, 443, 53), connections to external IPs on unusual ports</div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-2 text-base">How to Follow a TCP Stream</h3>
            <ol className="list-decimal list-inside space-y-1 text-[12px] ml-2">
              <li>Select a TCP packet (protocol shows TCP)</li>
              <li>Open Packet Detail → Stream tab</li>
              <li>View reconstructed conversation for that connection</li>
              <li>Look for complete HTTP requests/responses or protocol messages</li>
              <li>Stream shows all packets sharing the same 5-tuple (src IP:port → dst IP:port)</li>
            </ol>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-2 text-base">Spot Credentials in Plaintext</h3>
            <ul className="list-disc list-inside space-y-1 text-[12px] ml-2">
              <li>Filter for HTTP POST requests (proto==HTTP, contains POST)</li>
              <li>Check packet payload for: username=, password=, login, auth</li>
              <li>Look for base64 encoding (long alphanumeric strings)</li>
              <li>Search hex view for ASCII strings matching credential patterns</li>
              <li>Always verify if credentials appear before encryption (HTTPS/TLS)</li>
            </ul>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-2 text-base">What is an "Evidence Packet"?</h3>
            <div className="text-[12px] space-y-2">
              <p>An evidence packet contains the smoking gun that proves malicious activity:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>The exact packet showing data exfiltration (file transfer, credential leak)</li>
                <li>The packet containing suspicious indicators (C2 domain, malware signature)</li>
                <li>The packet that reveals the attack vector (unusual port, DNS tunneling)</li>
              </ul>
              <p className="mt-2">Mark packets as evidence by clicking "MARK AS EVIDENCE" or pressing M key. Submit your findings when confident.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-2 text-base">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div><kbd className="px-2 py-1 bg-gray-800 rounded">F</kbd> Focus filter bar</div>
              <div><kbd className="px-2 py-1 bg-gray-800 rounded">↑</kbd> Previous packet</div>
              <div><kbd className="px-2 py-1 bg-gray-800 rounded">↓</kbd> Next packet</div>
              <div><kbd className="px-2 py-1 bg-gray-800 rounded">M</kbd> Mark evidence</div>
              <div><kbd className="px-2 py-1 bg-gray-800 rounded">Enter</kbd> Select/open packet</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

