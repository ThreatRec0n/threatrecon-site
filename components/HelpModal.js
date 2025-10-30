import React from 'react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-terminal-green font-mono">TRAINING CURRICULUM</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 space-y-8 text-gray-300 font-mono text-sm">
          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">Reading Packets 101</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p>Every network packet contains multiple protocol layers stacked on top of each other:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Ethernet II</strong>: Physical network addressing (MAC addresses)</li>
                <li><strong>IP (IPv4/IPv6)</strong>: Source and destination IP addresses, routing information</li>
                <li><strong>TCP/UDP</strong>: Ports, connection management, sequencing</li>
                <li><strong>Application Layer</strong>: HTTP, DNS, SMB, SMTP, SSH — the actual data</li>
              </ul>
              <p className="mt-2">In Packet Hunt, click a packet to see all layers decoded. The <strong>Summary</strong> tab gives you a quick overview, <strong>Headers</strong> shows the full tree, <strong>Hex/ASCII</strong> shows raw bytes, and <strong>Stream</strong> reconstructs conversations.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">Detecting Credential Theft</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p><strong>What to look for:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>HTTP POST requests to <code>/login</code> or <code>/auth</code> endpoints</li>
                <li><code>Authorization: Basic</code> headers with base64-encoded credentials</li>
                <li>Plaintext <code>username=</code> and <code>password=</code> in POST body</li>
                <li>SMTP <code>AUTH PLAIN</code> commands with base64 blobs</li>
              </ul>
              <p className="mt-2"><strong>Filter examples:</strong></p>
              <div className="bg-gray-800/50 border border-gray-700 rounded p-2 font-mono text-[11px]">
                <div>proto==HTTP contains "login"</div>
                <div>contains "Authorization: Basic"</div>
                <div>contains "password"</div>
              </div>
              <p className="mt-2"><strong>Why it matters:</strong> Credentials sent in plaintext HTTP (not HTTPS) can be intercepted by anyone on the network. Always use encrypted channels for authentication.</p>
              <p className="mt-2"><strong>🔍 Analyst Tip:</strong> Credential theft often shows as Authorization headers (HTTP) or AUTH commands (SMTP/IMAP). You are allowed to call that out in an IR report as proof.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">Detecting Data Exfiltration</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p><strong>Common exfil methods:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>HTTP POST:</strong> Large files uploaded to external servers via <code>multipart/form-data</code></li>
                <li><strong>DNS Tunneling:</strong> Data encoded in DNS query subdomains</li>
                <li><strong>SMB Copy:</strong> Files copied between hosts on port 445</li>
                <li><strong>FTP/SFTP:</strong> Bulk file transfers</li>
              </ul>
              <p className="mt-2"><strong>Red flags:</strong></p>
              <div className="bg-gray-800/50 border border-gray-700 rounded p-2 font-mono text-[11px]">
                <div>• HTTP POST to external IP (not internal server)</div>
                <div>• Content-Disposition: filename="confidential*.xlsx"</div>
                <div>• Unusually large payload sizes</div>
                <div>• DNS queries with base64-looking subdomains</div>
              </div>
              <p className="mt-2">Use the <strong>Stream</strong> tab to reconstruct full HTTP conversations and see complete file transfer sequences.</p>
              <p className="mt-2"><strong>🔍 Analyst Tip:</strong> Exfil over HTTP POST usually has a body that looks like a file upload or contains internal filenames (payroll, client_export.csv, etc).</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">Beaconing / C2 and Why Timing Matters</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p><strong>C2 (Command and Control) beacons</strong> are periodic check-ins from malware to an attacker's server.</p>
              <p><strong>Characteristics:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Small payloads (often just a heartbeat)</li>
                <li>Regular time intervals (every 60 seconds, every 300 seconds, etc.)</li>
                <li>External IP destinations (often cloud or VPS providers)</li>
                <li>Persistent connections that don't match normal application patterns</li>
              </ul>
              <p className="mt-2"><strong>How to spot it:</strong></p>
              <div className="bg-gray-800/50 border border-gray-700 rounded p-2 font-mono text-[11px]">
                <div>1. Filter by destination IP: ip.dst==&lt;suspicious-ip&gt;</div>
                <div>2. Note packet timestamps — calculate intervals</div>
                <div>3. Look for patterns: packet at 10:00:01, 10:01:01, 10:02:01 = 60-second beacon</div>
              </div>
              <p className="mt-2">Timing analysis is critical. Legitimate applications don't make perfectly timed requests every N seconds.</p>
              <p className="mt-2"><strong>🔍 Analyst Tip:</strong> Beaconing / C2 is small but periodic. The timing matters more than the payload.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">Lateral Movement in SMB</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p>After initial compromise, attackers move through the network using legitimate protocols.</p>
              <p><strong>SMB (Server Message Block)</strong> on port 445 is commonly used for Windows file sharing.</p>
              <p><strong>Attack patterns:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Unauthorized file access from compromised host to other internal hosts</li>
                <li>File copy operations (<code>SMB Copy</code>) of sensitive documents</li>
                <li>Internal-to-internal traffic that wasn't normal before the incident</li>
                <li>Sensitive filenames in SMB commands: <code>payroll.xlsx</code>, <code>clients.csv</code></li>
              </ul>
              <p className="mt-2"><strong>Filter:</strong> <code>port==445</code> or <code>proto==SMB</code></p>
              <p className="mt-2">The challenge is distinguishing normal file access from malicious lateral movement. Look for access to files/servers the compromised host shouldn't normally access.</p>
              <p className="mt-2"><strong>🔍 Analyst Tip:</strong> SMB lateral movement: internal-to-internal file access on 445/tcp that doesn't match normal workstation behavior can indicate staging of data for later exfil.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">DNS Tunneling / Covert Channels</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p>Attackers encode data into DNS queries to bypass firewalls.</p>
              <p><strong>How it works:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Data is base64-encoded or hex-encoded</li>
                <li>Encoded data becomes the subdomain: <code>SGVsbG8=</code>.exfil.example.com</li>
                <li>DNS queries are usually allowed through firewalls</li>
                <li>Attacker's DNS server decodes the subdomain to extract data</li>
              </ul>
              <p className="mt-2"><strong>Detection:</strong></p>
              <div className="bg-gray-800/50 border border-gray-700 rounded p-2 font-mono text-[11px]">
                <div>• Extremely long domain names (normal domains are ~20-30 chars)</div>
                <div>• Random-looking subdomains with base64/hex patterns</div>
                <div>• High volume of DNS queries from a single source</div>
                <div>• Queries that don't resolve to real domains</div>
              </div>
              <p className="mt-2">Filter: <code>proto==DNS</code> and look for queries with suspiciously long or random subdomains.</p>
              <p className="mt-2"><strong>🔍 Analyst Tip:</strong> DNS tunneling often hides data in long subdomains. A normal DNS query is short (hostnames, brands). Tunneling looks like encoded junk or base64 chunks.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">Following Streams</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p>The <strong>Stream</strong> tab reconstructs full conversations from multiple packets in the same TCP flow.</p>
              <p><strong>How it works:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Packets are grouped by 5-tuple: source IP:port → destination IP:port</li>
                <li>TCP payloads are concatenated in order</li>
                <li>You see the complete HTTP request/response, not just fragments</li>
              </ul>
              <p className="mt-2"><strong>Why it matters:</strong></p>
              <p>Evidence often spans multiple packets. A file upload might have:</p>
              <div className="bg-gray-800/50 border border-gray-700 rounded p-2 font-mono text-[11px]">
                <div>Packet 1: HTTP POST headers</div>
                <div>Packet 2-10: File data chunks</div>
              </div>
              <p className="mt-2">The Stream tab shows you the complete transaction, making it easier to identify exfil patterns, credential leaks, and protocol abuse.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">ICMP Scanning / Reconnaissance</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p>ICMP (Internet Control Message Protocol) is often used for network discovery and scanning.</p>
              <p><strong>Attack patterns:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Repeated ping requests to incrementing IP addresses</li>
                <li>ICMP echo requests to hosts that don't normally receive pings</li>
                <li>Patterns that indicate automated scanning scripts</li>
              </ul>
              <p className="mt-2"><strong>🔍 Analyst Tip:</strong> ICMP scan/recon: repeated pings to incrementing IPs, often before exploitation.</p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">Common PCAP Filters You Must Know</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <div className="bg-gray-800/50 border border-gray-700 rounded p-2 font-mono text-[11px] space-y-1">
                <div><strong>IP filters:</strong></div>
                <div>ip.src==192.168.1.100    # Source IP</div>
                <div>ip.dst==10.0.0.1          # Destination IP</div>
                <div>ip==172.16.0.5            # Either IP</div>
                <div className="mt-2"><strong>Port filters:</strong></div>
                <div>port==80                  # Any port 80</div>
                <div>port==443                 # Any port 443</div>
                <div className="mt-2"><strong>Protocol filters:</strong></div>
                <div>proto==HTTP               # HTTP packets</div>
                <div>proto==DNS                # DNS packets</div>
                <div>proto==TCP                # TCP packets</div>
                <div className="mt-2"><strong>Content filters:</strong></div>
                <div>contains "password"       # Payload contains text</div>
                <div>contains "login"          # Search payload</div>
              </div>
              <p className="mt-2">Combine filters: <code>ip.dst==192.168.1.1 proto==HTTP contains "POST"</code></p>
            </div>
          </section>

          <section>
            <h3 className="text-terminal-green font-semibold mb-3 text-base">What Counts As "Evidence" in Incident Response</h3>
            <div className="text-[12px] space-y-2 leading-relaxed">
              <p>Not every suspicious packet is evidence. Evidence proves a specific attack technique or data theft.</p>
              <p><strong>Good evidence packets:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>HTTP POST with actual file data being uploaded (not just headers)</li>
                <li>DNS query containing encoded exfil data in the subdomain</li>
                <li>Packet showing credentials in cleartext (not just a login attempt)</li>
                <li>SMB command showing unauthorized file copy operation</li>
                <li>Beacon packet at the start of a periodic pattern</li>
              </ul>
              <p className="mt-2"><strong>Weak evidence (don't submit these alone):</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Just an IP address connection (could be legitimate)</li>
                <li>Normal DNS query (unless the domain is malicious)</li>
                <li>TCP SYN packet (just a connection attempt, no data)</li>
              </ul>
              <p className="mt-2"><strong>The rule:</strong> The packet must contain the actual malicious payload or behavior, not just metadata. Look for the packet that proves the crime, not just shows that communication happened.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
