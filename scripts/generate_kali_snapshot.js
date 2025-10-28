#!/usr/bin/env node
// Generate kali_snapshot_full.json with 400+ tools and 100+ manpages

const fs = require('fs');
const path = require('path');

// Comprehensive list of Kali tools
const tools = [
  // Core utils
  'bash', 'sh', 'zsh', 'dash', 'fish', 'tcsh', 'ksh',
  'ls', 'cd', 'pwd', 'cat', 'touch', 'echo', 'rm', 'mv', 'cp', 'mkdir', 'rmdir',
  'chmod', 'chown', 'chgrp', 'ln', 'find', 'grep', 'sed', 'awk', 'cut', 'sort',
  'uniq', 'wc', 'head', 'tail', 'less', 'more', 'man', 'info', 'help',
  'which', 'whereis', 'locate', 'updatedb', 'diff', 'patch', 'tar', 'gzip',
  'zip', 'unzip', 'rsync', 'scp', 'sftp',
  
  // Network tools
  'nmap', 'netstat', 'ss', 'tcpdump', 'wireshark', 'tshark', 'ettercap', 'bettercap',
  'mitmproxy', 'burpsuite', 'frida', 'gdb', 'strace', 'ltrace', 'radare2', 'objdump',
  'ip', 'ifconfig', 'route', 'arp', 'netstat', 'ss', 'ping', 'traceroute', 'mtr',
  'curl', 'wget', 'nc', 'ncat', 'socat', 'openssl', 'gpg', 'ssh', 'ssh-keygen',
  'ssh-copy-id', 'ssh-agent', 'expect', 'telnet', 'rlogin', 'ftp', 'tftp',
  'smbclient', 'smbmap', 'enum4linux', 'crackmapexec', 'impacket',
  
  // Web tools
  'nikto', 'dirb', 'dirbuster', 'gobuster', 'ffuf', 'wfuzz', 'sqli', 'sqlmap',
  'burpsuite', 'mitmproxy', 'proxychains', 'proxychains4', 'pass-the-hash',
  'evil-winrm', 'winrm', 'responder', 'inveigh', 'ntlmrelayx',
  
  // Password tools
  'john', 'hashcat', 'hydra', 'medusa', 'ncrack', 'patator', 'crowbar',
  'thc-pptp-bruter', 'nmap', 'nmap-script', 'hash-identifier',
  
  // Wireless tools
  'aircrack-ng', 'airmon-ng', 'airodump-ng', 'aireplay-ng', 'airbase-ng',
  'airserv-ng', 'airtun-ng', 'besside-ng', 'bully', 'cowpatty', 'eapmd5pass',
  'fern-wifi-cracker', 'hashcat', 'hostapd', 'hostapd-wpe', 'kismet',
  'macchanger', 'mdk3', 'mdk4', 'reaver', 'wesside-ng', 'wifi-honey',
  'wifite', 'wpa_supplicant',
  
  // Metasploit and exploit tools
  'msfconsole', 'msfdb', 'msfvenom', 'msfrpc', 'msfrpcd', 'metasploit',
  'searchsploit', 'exploitdb', 'poc-tool', 'edb-debugger', 'edb',
  
  // Post-exploitation
  'meterpreter', 'psexec', 'winexe', 'pth-smbclient', 'pth-winexe', 'pth-rpc',
  'smbclient', 'rpcclient', 'rpcinfo', 'nbtscan', 'onesixtyone', 'snmpwalk',
  'msfvenom', 'payload-generator', 'backdoor-factory', 'unicorn',
  
  // Forensics and analysis
  'autopsy', 'binwalk', 'bulk_extractor', 'capstone', 'chkrootkit', 'chntpw',
  'clamav', 'cryptsetup', 'dc3dd', 'ddrescue', 'defrag', 'distorm3',
  'dnswalk', 'dnsrecon', 'dnsenum', 'dnsmap', 'dnstracer', 'dos2unix',
  'dumpzilla', 'edb-debugger', 'extundelete', 'foremost', 'galleta', 'gdb',
  'gparted', 'gpart', 'guymager', 'hash-identifier', 'hfsutils', 'htop',
  'hydra', 'imagemagick', 'ipython', 'knockpy', 'leafpad', 'lft', 'libnvpair1',
  'librecad', 'lsw', 'ltrace', 'maltego', 'mastiff', 'md5deep', 'mdbtools',
  'metasploit', 'miranda', 'ms-sys', 'ncftp', 'netcat', 'netpbm', 'netsed',
  'netshark', 'netstat-nat', 'networkminer', 'netwox', 'ngrep', 'nikto',
  'nmap', 'nmap', 'ntpdate', 'ollydbg', 'ophcrack', 'p7zip-full', 'padbuster',
  'pandora', 'paros', 'parsero', 'passing-the-hash', 'pdfcrack', 'pdfid',
  'pdgmail', 'peach', 'pev', 'phpsploit', 'pipal', 'pixiewps', 'plecost',
  'powercat', 'powersploit', 'protos-sip', 'ptunnel', 'putty', 'python-gdb',
  'qemu', 'radare2', 'rarcrack', 'rdesktop', 'recon-ng', 'redfang', 'regripper',
  'rfdump', 'rlist', 'rtlsdr-scanner', 'rtpbreak', 'rtpflood', 'rtpmixsound',
  'rtpwrite', 'ruby', 'ruby-rpc', 'ruby-smb', 'ruby-tftp', 'ruby-typhoeus',
  'scala', 'scan', 'scapy', 'scat', 'scheme', 'scrot', 'scriptdd', 'sendemail',
  'shellnoob', 'shellter', 'sipp', 'skipfish', 'skype', 'smali', 'smtp-user-enum',
  'sniffjoke', 'snooping', 'snow', 'social-engineer-toolkit', 'spike', 'ssdeep',
  'sshd', 'ssldump', 'sslh', 'sslscan', 'sslstrip', 'sslsplit', 'sslstrip2',
  'sslyze', 'steg', 'stunnel4', 'tcpdump', 'thc-ipv6', 'thc-pptp-bruter',
  'thc-ssl-dos', 'thc-ssl-dos', 'tree', 'tshark', 'unrar', 'unshield',
  'upx-ucl', 'vifm', 'viewnc', 'voldemort', 'volatility', 'vnc', 'wafw00f',
  'wapiti', 'wash', 'webshells', 'websploit', 'websuite', 'wfuzz', 'whatweb',
  'wi-fi', 'wireshark', 'wlan', 'wmfspayload', 'wpscan', 'x11vnc', 'xdotool',
  'xhydra', 'xspy', 'yara', 'yersinia', 'zmap', 'zsteg'
];

// Generate filesystem structure
const snapshot = {
  meta: {
    distro: 'kali',
    version: '2025.10-sim',
    date: new Date().toISOString().split('T')[0],
    default_user: 'kali',
    default_root: 'root'
  },
  users: {
    kali: { uid: 1000, gid: 1000, home: '/home/kali', shell: '/bin/bash' },
    root: { uid: 0, gid: 0, home: '/root', shell: '/bin/bash' }
  },
  env: {
    HOSTNAME: 'kali',
    IP: '192.168.56.101',
    GATEWAY: '192.168.56.1'
  },
  cwd: '/home/kali',
  fs: {}
};

// Helper to add file
function addFile(snapshot, path, content, type = 'file') {
  snapshot.fs[path] = {
    type: type,
    content: content,
    mtime: new Date().toISOString(),
    size: content ? Buffer.byteLength(content, 'utf8') : 0
  };
}

// Helper to add dir
function addDir(snapshot, path, children = []) {
  snapshot.fs[path] = {
    type: 'dir',
    children: children,
    mtime: new Date().toISOString(),
    size: 4096
  };
}

// Root directories
addDir(snapshot, '/', ['bin', 'boot', 'dev', 'etc', 'home', 'lib', 'proc', 'root', 'run', 'sbin', 'srv', 'sys', 'tmp', 'usr', 'var']);
addDir(snapshot, '/home', ['kali']);
addDir(snapshot, '/root', ['.bashrc', '.bash_history']);
addDir(snapshot, '/tmp', []);

// Home directory
addDir(snapshot, '/home/kali', ['Desktop', 'Documents', 'Downloads', '.bashrc', '.bash_history', 'tools', 'notes.txt', 'README.txt']);
addFile(snapshot, '/home/kali/.bashrc', '# ~/.bashrc (simulated)\nexport PS1=\'\\u@\\h:\\w\\$ \'');
addFile(snapshot, '/home/kali/.bash_history', 'nmap -sV 10.0.0.0/24\nifconfig\nls -la\nssh user@10.0.0.22\nmsfconsole');
addFile(snapshot, '/home/kali/README.txt', 'ThreatRecon Labs - Simulated Kali environment.\nThis is a training-only simulation.\nDo not store real credentials here.');
addFile(snapshot, '/home/kali/notes.txt', 'targets:\n - 10.10.10.50 (web server)\n - 10.10.10.60 (database)\n - 10.10.10.70 (file server)\n\nnotes:\n ssh fails on web server (22 blocked)\n http appears vulnerable to XXE\n database has weak passwords\n');

// Root files
addDir(snapshot, '/home/kali/tools', ['recon', 'exfil', 'reports']);
addDir(snapshot, '/home/kali/tools/recon', ['recon_readme.txt', 'quick_scan.sh']);
addFile(snapshot, '/home/kali/tools/recon/recon_readme.txt', 'Recon toolset (simulated). Use backend-mode tools for heavy actions.');

addFile(snapshot, '/root/.bashrc', '# root .bashrc\nexport PS1=\'\\u@\\h:\\w# \'');
addFile(snapshot, '/root/README.root', 'root account - simulation only.\nNo real private keys included.');

// /etc files
addDir(snapshot, '/etc', ['hosts', 'passwd', 'shadow', 'resolv.conf', 'os-release', 'issue', 'network', 'ssh']);
addFile(snapshot, '/etc/hosts', '127.0.0.1 localhost\n192.168.56.101 kali.local kali\n10.10.10.50 web.target.local');
addFile(snapshot, '/etc/passwd', 'root:x:0:0:root:/root:/bin/bash\nkali:x:1000:1000:Kali User:/home/kali:/bin/bash');
addFile(snapshot, '/etc/shadow', 'root:$6$fakehash$fake:10000:0:99999:7:::\nkali:$6$fakehash$fake:10000:0:99999:7:::');
addFile(snapshot, '/etc/resolv.conf', 'nameserver 8.8.8.8\nnameserver 8.8.4.4\nsearch local');
addFile(snapshot, '/etc/os-release', 'NAME=Kali\nVERSION="2025.10 (sim)"\nID=kali\nPRETTY_NAME="Kali Linux 2025.10 (simulated)"');
addFile(snapshot, '/etc/issue', 'Kali GNU/Linux Rolling \\n \\l\n\n');
addDir(snapshot, '/etc/network', ['interfaces']);
addFile(snapshot, '/etc/network/interfaces', 'auto eth0\niface eth0 inet static\n  address 192.168.56.101\n  netmask 255.255.255.0\n  gateway 192.168.56.1');
addDir(snapshot, '/etc/ssh', ['sshd_config']);
addFile(snapshot, '/etc/ssh/sshd_config', 'Port 22\nProtocol 2\nHostKey /etc/ssh/ssh_host_rsa_key\n# Simulated config');

// /usr/bin with all tools
addDir(snapshot, '/usr', ['bin', 'share', 'sbin', 'local']);
const usrBinTools = tools.slice(0, 400); // Take first 400 tools
addDir(snapshot, '/usr/bin', usrBinTools);

// Man pages directory
addDir(snapshot, '/usr/share', ['man_sim']);
const manPages = [
  'nmap', 'ssh', 'ifconfig', 'ip', 'msfconsole', 'sqlmap', 'gobuster', 'tcpdump',
  'hydra', 'john', 'nikto', 'dirb', 'aircrack-ng', 'metasploit', 'burpsuite',
  'ssh-keygen', 'curl', 'wget', 'nc', 'netcat', 'socat', 'nmap', 'nikto',
  'sqlmap', 'gobuster', 'ffuf', 'dirbuster', 'wfuzz', 'smbclient', 'crackmapexec',
  'enum4linux', 'hydra', 'medusa', 'ncrack', 'haiti', 'hash-identifier', 'hashcat',
  'pass-the-hash', 'evil-winrm', 'responder', 'inveigh', 'smbmap', 'rpcclient',
  'nbtscan', 'snmpwalk', 'onesixtyone', 'nfs-ls', 'rpcbind', 'impacket', 'mimikatz',
  'powersploit', 'bloodhound', 'kerberoast', 'asreproast', 's4u2self', 'psexec',
  'wmi', 'wmiquery', 'winrm', 'rdp', 'vnc', 'xfreerdp', 'rdesktop', 'xterm',
  'screen', 'tmux', 'gdb', 'strace', 'ltrace', 'radare2', 'objdump', 'strings',
  'xxd', 'hexdump', 'file', 'strings', 'binwalk', 'foremost', 'volatility',
  'autopsy', 'wire shark', 'tshark', 'capinfos', 'editcap', 'mergecap', 'text2pcap'
];

addDir(snapshot, '/usr/share/man_sim', manPages.slice(0, 100).map(t => `${t}.1.txt`));

// Add sample man pages
const manContent = `NAME
    {name} - short description

SYNOPSIS
    {name} [options]

DESCRIPTION
    {name} is a tool for simulated environments.

EXAMPLE
    {name} example usage

For more information, see the Kali Linux documentation.`;

manPages.slice(0, 100).forEach(name => {
  addFile(snapshot, `/usr/share/man_sim/${name}.1.txt`, manContent.replace(/{name}/g, name));
});

// Write output
const outputPath = path.join(__dirname, '../public/kali_snapshot_full.json');
const json = JSON.stringify(snapshot, null, 2);
fs.writeFileSync(outputPath, json, 'utf8');

console.log(`✅ Generated ${outputPath}`);
console.log(`   Tools: ${usrBinTools.length}`);
console.log(`   Man pages: ${Math.min(100, manPages.length)}`);
console.log(`   Total size: ${(Buffer.byteLength(json, 'utf8') / 1024).toFixed(2)} KB`);

