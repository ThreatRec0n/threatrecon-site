// 10-page Wireshark training pack content
export const WIRESHARK_STUDY_PACK = [
  {
    title: "Introduction to Packet Analysis and Wireshark",
    content: `Packet analysis is the process of capturing and interpreting network traffic to understand what devices are communicating and what data they exchange. Wireshark is the industry standard packet analyzer that lets investigators view packet-level details across all layers of the network stack — from Ethernet frames up through application data (HTTP, DNS, SIP, etc.). Core uses include troubleshooting, security investigations, and protocol learning.

In practice you will:

• Capture traffic with a network tap or mirrored port, or read saved PCAPs.
• Use display filters to find relevant packets (Wireshark BPF and display filters differ).
• Follow streams (TCP, UDP, RTP) to reconstruct application-level artifacts.
• Inspect headers (IP TTL, TCP seq/ack, flags) and payload (HTTP requests, DNS queries).
• Document findings and export evidence (packets, streams, audio).

Key learning goals in this app:

• Understand how to recognize suspicious patterns (exfil via HTTP POST, DNS tunneling, C2 beaconing).
• Learn how to reconstruct streams and recover artifacts like credential strings or transferred files.
• Build intuition for timelines, packet ordering, reassembly issues, and forensic chain of custody (notes, transcripts).`
  },
  {
    title: "Understanding the Network Stack (Ethernet → IP → TCP/UDP → App)",
    content: `Every captured packet contains layered headers. In order from bottom to top:

Ethernet: Source and destination MAC addresses; Ethertype indicates next protocol (e.g., 0x0800 = IPv4).

IP (v4/v6): Source/destination IP, TTL, protocol field (6 = TCP, 17 = UDP).

Transport (TCP/UDP): Ports, TCP flags (SYN/ACK/FIN/RST/PSH), sequence/ACK numbers, UDP length.

Application: Protocol-specific information (HTTP method/URI/headers, DNS qname/qtype, SIP messages).

Forensics implications:

• Changes in TTL can suggest route hops or an intermediate NAT/firewall.
• TCP flags and sequence numbers tell you about connection setup/teardown and retransmissions.
• UDP is connectionless and typically used by streaming protocols (DNS queries, VoIP RTP); many covert channels exploit UDP.

Practice: For each packet, always read the protocol stack and confirm directionality src:port → dst:port. Use Follow TCP Stream to reconstruct application payloads.`
  },
  {
    title: "Filters & Finding Evidence",
    content: `Wireshark offers two filter families:

Capture filters (libpcap BPF): used when capturing live (e.g., tcp port 80).

Display filters: used to narrow shown packets after capture (e.g., http.request.method == "POST").

Common display filters:

• ip.src == 192.168.1.10
• tcp.port == 80 or tcp.port == 443
• dns.qry.name contains "example"
• frame.len > 1000
• http.content_type contains "multipart/form-data"

To find exfil via HTTP:

• Search http.request.method == "POST" and check Content-Disposition or filename headers.

For DNS tunneling:

• Look for frequent long qname strings, base64-like domains, high query rates.

For credential leaks:

• contains "password" or follow TCP stream and scan payload text for user, pwd, or common markers.

Practice: build a library of display filters and test them against challenge scenarios.`
  },
  {
    title: "TCP Reassembly and Dealing with Loss/Out of Order",
    content: `TCP is a stream protocol. Wireshark reassembles TCP segments into a contiguous byte stream for the Follow TCP Stream view. For accurate reassembly:

• Check SEQ/ACK values to confirm ordering.
• Identify retransmissions (same seq again) and out-of-order segments (out-of-window).
• Keep an eye on the tcp.analysis.retransmission and tcp.analysis.out_of_order flags.

Loss and latency:

• Packet loss leads to retransmissions or gaps in reassembly. Use TCP time sequence graphs to visualize throughput and gaps.
• If payload appears scrambled or missing, inspect for middleboxes (proxies) or TCP checkpointing.

Practice: identify a broken HTTP POST split across multiple segments and reassemble to find the transferred filename.`
  },
  {
    title: "UDP, DNS, and Tunneling Techniques",
    content: `UDP is stateless, making it attractive for covert channels. DNS is a common tunneling vector because many networks allow DNS to pass freely.

Indicators of DNS tunneling:

• Unusually long or frequent DNS queries.
• Encoded payloads in query names (base32/base64-like strings).
• High ratio of queries to legitimate domain names.

Defensive steps:

• Inspect dns.qry.name patterns and entropy.
• Tally query rates by host and domain — anomalies often stand out.
• Look for authoritative responses with suspicious CNAME chaining.

Practice: find a DNS query carrying base64 and decode it to reveal exfiltrated text.`
  },
  {
    title: "HTTP Forensics & File Exfiltration via POST",
    content: `HTTP is a favorite for exfil because it flows over port 80/443. When investigating HTTP POST-based exfil:

• Look for POST requests with Content-Type: multipart/form-data.
• Inspect Content-Disposition headers for filenames.
• Check the Host header for external domains.
• If HTTP is SSL/TLS (HTTPS), you will not see plaintext; in the lab, we simulate cleartext or instruct how to decrypt with TLS keys.

Reassembling files:

• Follow the TCP stream for the POST and extract the multipart/form-data boundaries to re-create the payload.
• If files are base64 encoded in the body, decode them to reconstruct the file.

Practice: pick a POST containing voice_call_2025-10-29.raw and reconstruct it.`
  },
  {
    title: "SIP & RTP: Reconstructing VoIP Calls",
    content: `SIP controls call setup; RTP carries media. Steps to analyze VoIP:

• Find SIP INVITE/200 OK/ACK messages; read the SDP (Session Description Protocol). SDP lists IPs, ports, and payload types (PT).
• Map RTP streams by SSRC, payload type, and 5-tuple (srcIP:srcPort → dstIP:dstPort).
• Decode common codecs (G.711 μ-law/ a-law) into PCM and play or export as WAV.
• Check sequencing and jitter information for packet loss (missing seq numbers) or out-of-order.

Forensically relevant tasks:

• Reconstruct and listen to suspect calls (educational only).
• Identify timestamps and sequence numbers to produce a timeline.

Practice: use the RTP player to export WAV from the decoded stream and view packet boundaries on the waveform.`
  },
  {
    title: "Authentication Leaks & Common Mistakes",
    content: `Many breaches involve leaked credentials or tokens in cleartext:

• HTTP Basic Auth: Look for Authorization: Basic headers.
• Old protocols (FTP, Telnet, POP3) often send credentials as plain text.
• Misconfigured services may place tokens in URLs or headers.

Best practices when hunting:

• Search for common keywords (Authorization, passwd, login, token, password).
• Use Follow TCP Stream to inspect the full session context.

Practice: find an HTTP Basic Auth header and decode Base64 to recover credentials (for lab use only).`
  },
  {
    title: "Chain of Custody, Notes & Evidence Export",
    content: `Any practice should be accompanied by disciplined note taking:

• Record timestamps, filters used, packet numbers (No.), and actions taken.
• When exporting evidence, include packet numbers and descriptive notes.
• Use localStorage for session notes in the training app; in real investigations, export PCAP snippets and hashes for integrity.

Evidence export examples:

• Export a single packet or a TCP stream as a PCAP.
• Export reassembled files and compute an MD5/SHA256 to record.

Practice: mark evidence packets, submit findings, and save the debrief transcript.`
  },
  {
    title: "Putting it together: Typical Playbook for a Packet Hunt",
    content: `Start with an incident summary: what behavior was reported?

1. Apply broad filters by protocol or host to reduce noise.
2. Scan for obvious patterns: repeated connections, large POSTs, unusual DNS patterns, unknown external IPs.
3. Follow streams of interest (TCP/RTP) to reconstruct payloads.
4. Mark candidate evidence and attempt reconstruction (files, audio, credentials).
5. Validate findings (is the file truly malicious? is the payload complete? are there related flows?).
6. Document and export artifacts for teaching or handoff.

This app's scenarios map to those steps; practice them in order and use the Study Pack to deepen knowledge after each round.`
  }
];
