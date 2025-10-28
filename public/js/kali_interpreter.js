// kali_interpreter.js - Full Kali Linux CLI simulator
// Handles local commands before delegating to backend

(function() {
  'use strict';

  window.kali_interpreter = {
    runtime: null,
    
    getPrompt() {
      const BOLD='\x1b[1m';
      const RED='\x1b[31m';
      const GREEN='\x1b[32m';
      const CYAN='\x1b[36m';
      const YELLOW='\x1b[33m';
      const RESET='\x1b[0m';
      
      const u = this.runtime.asRoot ? 'root' : (this.runtime.env.USER || 'kali');
      const h = this.runtime.env.HOSTNAME || 'kali';
      const cwdRaw = this.runtime.cwd || '/home/kali';
      const c = (cwdRaw === '/home/kali') ? '~' : cwdRaw.replace('/home/kali', '~');
      const s = this.runtime.asRoot ? '#' : '$';
      
      return `${BOLD}${RED}${u}${RESET}${BOLD}@${GREEN}${h}${RESET}:${CYAN}${c}${RESET}${YELLOW}${s}${RESET} `;
    },
    
    // Initialize runtime from localStorage or snapshot
    async init(snapshot) {
      try {
        const saved = localStorage.getItem('kali_runtime');
        if (saved) {
          this.runtime = JSON.parse(saved);
          console.info('[Kali] Loaded runtime from localStorage');
        } else {
          this.runtime = {
            fs: snapshot.fs || {},
            net: snapshot.net || { eth0: { ip: '192.168.56.101', mac: '02:42:ac:11:00:02' } },
            env: snapshot.env || { HOSTNAME: 'kali', USER: 'kali', HOME: '/home/kali' },
            users: snapshot.users || {},
            cwd: snapshot.cwd || '/home/kali',
            asRoot: false,
            history: [],
            histIndex: -1
          };
          this.save();
        }
      } catch (e) {
        console.error('[Kali] Init failed:', e);
        this.runtime = { fs: {}, net: {}, env: {}, users: {}, cwd: '/home/kali', asRoot: false, history: [], histIndex: -1 };
      }
    },
    
    save() {
      try {
        localStorage.setItem('kali_runtime', JSON.stringify(this.runtime));
      } catch (e) {
        console.error('[Kali] Save failed:', e);
      }
    },
    
    getFSNode(path) {
      if (!path || !this.runtime.fs) return null;
      // Handle ~ expansion
      if (path === '~' || path === '~/') path = '/home/kali';
      if (path.startsWith('~/')) path = '/home/kali' + path.slice(1);
      
      // Handle relative paths
      if (!path.startsWith('/')) {
        let base = this.runtime.cwd || '/home/kali';
        if (base.endsWith('/')) base = base.slice(0, -1);
        path = base + '/' + path;
      }
      
      // Normalize path
      const parts = path.split('/').filter(p => p && p !== '.');
      const stack = [];
      for (const p of parts) {
        if (p === '..') {
          if (stack.length > 0) stack.pop();
        } else {
          stack.push(p);
        }
      }
      const norm = '/' + stack.join('/');
      return this.runtime.fs[norm] || null;
    },
    
    mkFSNode(path, type, content, children) {
      if (!path || path === '/') return false;
      if (path === '/') path = '';
      if (!this.runtime.fs) this.runtime.fs = {};
      
      if (type === 'dir') {
        this.runtime.fs['/' + path.split('/').filter(Boolean).join('/')] = { type: 'dir', children: children || [] };
      } else if (type === 'file') {
        this.runtime.fs['/' + path.split('/').filter(Boolean).join('/')] = { type: 'file', content: content || '' };
      }
      return true;
    },
    
    // Execute command locally or return false
    async handle(cmd, term) {
      if (!cmd) return false;
      
      const parts = cmd.trim().split(/\s+/);
      const cmdName = parts[0];
      const args = parts.slice(1);
      
      // Built-in commands
      const builtins = ['ls', 'cd', 'pwd', 'cat', 'touch', 'echo', 'rm', 'mv', 'cp', 'mkdir', 'rmdir', 
                        'whoami', 'id', 'hostname', 'uname', 'clear', 'history',
                        'ifconfig', 'ip', 'ping', 'sudo', 'su', 'passwd', 'useradd',
                        'less', 'more', 'man', 'nano', 'ps', 'top', 'apt'];
      
      if (!builtins.includes(cmdName)) {
        return false; // Forward to backend
      }
      
      try {
        switch (cmdName) {
          case 'ls': return this.cmd_ls(args, term);
          case 'cd': return this.cmd_cd(args, term);
          case 'pwd': return this.cmd_pwd(term);
          case 'cat': return this.cmd_cat(args, term);
          case 'touch': return this.cmd_touch(args, term);
          case 'echo': return this.cmd_echo(args, term);
          case 'rm': return this.cmd_rm(args, term);
          case 'mv': return this.cmd_mv(args, term);
          case 'cp': return this.cmd_cp(args, term);
          case 'mkdir': return this.cmd_mkdir(args, term);
          case 'rmdir': return this.cmd_rmdir(args, term);
          case 'whoami': return this.cmd_whoami(term);
          case 'id': return this.cmd_id(term);
          case 'hostname': return this.cmd_hostname(term);
          case 'uname': return this.cmd_uname(args, term);
          case 'clear': return this.cmd_clear(term);
          case 'history': return this.cmd_history(term);
          case 'ifconfig': return window.kali_network.cmd_ifconfig(args, this.runtime, term);
          case 'ip': return window.kali_network.cmd_ip(args, this.runtime, term);
          case 'ping': return window.kali_network.cmd_ping(args, term);
          case 'sudo': return this.cmd_sudo(args, term);
          case 'su': return this.cmd_su(args, term);
          case 'passwd': return this.cmd_passwd(args, term);
          case 'useradd': return this.cmd_useradd(args, term);
          case 'less':
          case 'more': return this.cmd_pager(args, term);
          case 'man': return this.cmd_man(args, term);
          case 'nano': return this.cmd_nano(args, term);
          case 'ps': return this.cmd_ps(args, term);
          case 'top': return this.cmd_top(term);
          case 'apt': return this.cmd_apt(args, term);
          default: return false;
        }
      } catch (e) {
        term.writeln(`Error: ${e.message}`);
        this.save();
        return true;
      }
    },
    
    // Command implementations
    cmd_ls(args, term) {
      const path = args.find(a => !a.startsWith('-')) || this.runtime.cwd;
      const detailed = args.includes('-l') || args.includes('-la');
      
      const node = this.getFSNode(path);
      if (!node) {
        term.writeln(`ls: cannot access '${path}': No such file or directory`);
        return true;
      }
      
      if (node.type !== 'dir') {
        term.writeln(`ls: cannot access '${path}': Not a directory`);
        return true;
      }
      
      if (detailed) {
        const files = node.children || [];
        files.forEach(f => {
          const p = this.runtime.cwd === '/' ? '/' + f : this.runtime.cwd + '/' + f;
          const fn = this.getFSNode(p);
          if (fn && fn.type === 'file') {
            term.writeln(`-rw-r--r-- 1 kali kali 1024 ${new Date().toISOString().split('T')[0]} ${f}`);
          } else {
            term.writeln(`drwxr-xr-x 2 kali kali 4096 ${new Date().toISOString().split('T')[0]} ${f}`);
          }
        });
      } else {
        term.writeln((node.children || []).join('  '));
      }
      this.save();
      return true;
    },
    
    cmd_cd(args, term) {
      const target = args[0] || '/home/kali';
      const node = this.getFSNode(target);
      if (!node) {
        term.writeln(`bash: cd: ${target}: No such file or directory`);
        return true;
      }
      if (node.type !== 'dir') {
        term.writeln(`bash: cd: ${target}: Not a directory`);
        return true;
      }
      this.runtime.cwd = node.path || target;
      this.save();
      return true;
    },
    
    cmd_pwd(term) {
      term.writeln(this.runtime.cwd);
      return true;
    },
    
    cmd_cat(args, term) {
      if (args.length === 0) {
        term.writeln('Usage: cat <file>');
        return true;
      }
      const node = this.getFSNode(args[0]);
      if (!node) {
        term.writeln(`cat: ${args[0]}: No such file or directory`);
        return true;
      }
      if (node.type === 'dir') {
        term.writeln(`cat: ${args[0]}: Is a directory`);
        return true;
      }
      term.writeln(node.content || '');
      return true;
    },
    
    cmd_touch(args, term) {
      if (args.length === 0) return true;
      const target = args[0];
      const node = this.getFSNode(target);
      if (!node) {
        const path = this.runtime.cwd === '/' ? '/' + target : this.runtime.cwd + '/' + target;
        this.mkFSNode(path, 'file', '');
        // Add to parent directory
        const parentNode = this.getFSNode(this.runtime.cwd);
        if (parentNode && parentNode.children) {
          parentNode.children.push(target);
        }
        this.save();
      }
      return true;
    },
    
    cmd_echo(args, term) {
      if (args.length > 1 && args[0] === '>>') {
        const file = args.slice(1).join(' ');
        // Append to file
        const node = this.getFSNode(file);
        if (node && node.type === 'file') {
          node.content += file + '\n';
          this.save();
        }
        return true;
      }
      term.writeln(args.join(' '));
      return true;
    },
    
    cmd_whoami(term) {
      term.writeln(this.runtime.asRoot ? 'root' : (this.runtime.env.USER || 'kali'));
      return true;
    },
    
    cmd_id(term) {
      if (this.runtime.asRoot) {
        term.writeln('uid=0(root) gid=0(root) groups=0(root)');
      } else {
        term.writeln('uid=1000(kali) gid=1000(kali) groups=1000(kali)');
      }
      return true;
    },
    
    cmd_hostname(term) {
      term.writeln(this.runtime.env.HOSTNAME || 'kali');
      return true;
    },
    
    cmd_uname(args, term) {
      term.writeln('Linux kali 5.15.0-sim x86_64 GNU/Linux');
      return true;
    },
    
    cmd_clear(term) {
      term.clear();
      return true;
    },
    
    cmd_history(term) {
      this.runtime.history.forEach((cmd, i) => {
        term.writeln(`  ${i + 1}  ${cmd}`);
      });
      return true;
    },
    
    cmd_sudo(args, term) {
      term.writeln(`[sudo] password for ${this.runtime.env.USER || 'kali'}: password`);
      this.runtime.asRoot = true;
      this.save();
      return true;
    },
    
    cmd_su(args, term) {
      if (args[0] && args[0] !== 'root') {
        term.writeln(`su: user ${args[0]} does not exist`);
        return true;
      }
      this.runtime.asRoot = true;
      this.runtime.env.USER = 'root';
      this.runtime.cwd = '/root';
      this.save();
      return true;
    },
    
    cmd_passwd(args, term) {
      term.writeln('Changing password for kali');
      term.writeln('(current) UNIX password:');
      term.writeln('New password:');
      term.writeln('Retype new password:');
      term.writeln('passwd: password updated successfully');
      return true;
    },
    
    cmd_useradd(args, term) {
      term.writeln(`useradd: creating new user ${args[args.length-1]}`);
      term.writeln(`useradd: uid 1001 gid 1001`);
      return true;
    },
    
    cmd_rm(args, term) {
      if (args.length === 0) return true;
      const node = this.getFSNode(args[0]);
      if (node) {
        // Remove from parent
        const pathParts = args[0].split('/');
        const filename = pathParts[pathParts.length-1];
        const parentPath = pathParts.slice(0, -1).join('/') || '/';
        const parent = this.getFSNode(parentPath);
        if (parent && parent.children) {
          parent.children = parent.children.filter(c => c !== filename);
        }
        // Delete the file node
        delete this.runtime.fs['/' + args[0].split('/').filter(p => p).join('/')];
        this.save();
      }
      return true;
    },
    
    cmd_mv(args, term) {
      if (args.length < 2) return true;
      term.writeln(`moved ${args[0]} to ${args[1]}`);
      this.save();
      return true;
    },
    
    cmd_cp(args, term) {
      if (args.length < 2) return true;
      term.writeln(`copied ${args[0]} to ${args[1]}`);
      this.save();
      return true;
    },
    
    cmd_mkdir(args, term) {
      if (args.length === 0) return true;
      const target = args[0];
      const node = this.getFSNode(target);
      if (!node) {
        const path = this.runtime.cwd === '/' ? '/' + target : this.runtime.cwd + '/' + target;
        this.mkFSNode(path, 'dir', null, []);
        const parent = this.getFSNode(this.runtime.cwd);
        if (parent && parent.children) {
          parent.children.push(target);
        }
        this.save();
      } else {
        term.writeln(`mkdir: cannot create directory '${target}': File exists`);
      }
      return true;
    },
    
    cmd_rmdir(args, term) {
      if (args.length === 0) return true;
      const node = this.getFSNode(args[0]);
      if (node && node.type === 'dir') {
        if (node.children && node.children.length > 0) {
          term.writeln(`rmdir: failed to remove '${args[0]}': Directory not empty`);
        } else {
          this.cmd_rm([args[0]], term);
        }
      }
      return true;
    },
    
    cmd_pager(args, term) {
      if (args.length === 0) return false;
      const node = this.getFSNode(args[0]);
      if (node && node.type === 'file' && node.content) {
        window.kali_pager.start(node.content, term);
        return true;
      }
      return false;
    },
    
    cmd_man(args, term) {
      if (args.length === 0) return false;
      const manPath = `/usr/share/man_sim/${args[0]}.1.txt`;
      const manPath2 = `/usr/share/man_sim/${args[0]}.8.txt`;
      const node = this.runtime.fs[manPath] || this.runtime.fs[manPath2];
      if (node && node.content) {
        window.kali_pager.start(node.content, term);
        return true;
      }
      term.writeln(`No manual entry for ${args[0]}`);
      return true;
    },
    
    cmd_nano(args, term) {
      if (args.length === 0) return false;
      const node = this.getFSNode(args[0]);
      if (!node || node.type === 'dir') {
        term.writeln(`nano: ${args[0]}: Is a directory or does not exist`);
        return true;
      }
      window.kali_editor.start(args[0], node, this, term);
      return true;
    },
    
    cmd_ps(args, term) {
      term.writeln('  PID TTY      TIME CMD');
      term.writeln('    1 ?        00:00:01 init');
      term.writeln('  102 ?        00:00:02 sshd');
      term.writeln('  201 ?        00:00:00 bash');
      term.writeln('  301 ?        00:00:05 nmap');
      term.writeln('  420 ?        00:00:03 metasploit');
      return true;
    },
    
    cmd_top(term) {
      term.writeln('top - 10:45:33 up 1 day,  2:15,  1 user,  load average: 0.12, 0.15, 0.10');
      term.writeln('Tasks: 145 total,   1 running, 144 sleeping,   0 stopped,   0 zombie');
      term.writeln('%Cpu(s):  2.5 us,  1.0 sy,  0.0 ni, 96.5 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st');
      term.writeln('KiB Mem : 4096000 total,  512000 free, 2048000 used, 1536000 buff/cache');
      term.writeln('  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND');
      term.writeln('  420 kali      20   0  102400   2048   1024 S   2.5   0.1   0:03.15 metasploit');
      term.writeln('  301 kali      20   0   51200   1024    512 S   1.0   0.0   0:02.10 nmap');
      return true;
    },
    
    cmd_apt(args, term) {
      if (!args[0]) return false;
      const action = args[0];
      if (action === 'update') {
        term.writeln('Get:1 http://kali.download/kali kali-rolling InRelease');
        term.writeln('Reading package lists... Done');
        return true;
      } else if (action === 'install') {
        term.writeln(`Setting up ${args[1] || 'package'} (1.0-1) ...`);
        return true;
      } else if (action === 'remove') {
        term.writeln('Removing package... Done');
        return true;
      } else if (action === 'search') {
        term.writeln(`Searching for "${args[1] || ''}"...`);
        term.writeln('package: tool-name - description');
        return true;
      }
      return false;
    }
  };

  console.info('[Kali] Interpreter module loaded');
})();
