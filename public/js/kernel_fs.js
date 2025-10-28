// kernel_fs.js - In-memory filesystem emulator
(function() {
  'use strict';

  let fsTree = {};
  let cwd = '/home/kali';
  let prevDir = '/home/kali';
  let kernelSessionRef = null;

  function resolvePath(rawPath) {
    // Defensive guard: handle arrays and non-strings
    if (Array.isArray(rawPath)) {
      rawPath = rawPath[0] || '';
    }
    if (typeof rawPath !== 'string') {
      rawPath = String(rawPath || '');
    }
    
    rawPath = rawPath.trim();
    
    if (!rawPath || rawPath === '') {
      return { ok: false, message: 'Empty path' };
    }
    
    let path = rawPath;
    if (path === '~') path = '/home/kali';
    path = path.replace(/^~(?=$|\/)/, '/home/kali');
    
    if (!path.startsWith('/')) {
      path = (cwd + '/' + path).replace(/\/+/g, '/');
    }
    
    const parts = path.split('/').filter(p => p);
    const stack = [];
    for (const p of parts) {
      if (p === '.') continue;
      if (p === '..') {
        if (stack.length > 0) stack.pop();
        continue;
      }
      stack.push(p);
    }
    
    const targetPath = '/' + stack.join('/');
    
    // Direct lookup
    if (fsTree[targetPath]) {
      return { ok: true, path: targetPath, node: fsTree[targetPath] };
    }
    
    // Case-insensitive fallback for last component
    const lastPart = stack[stack.length - 1];
    if (lastPart) {
      const parentPath = '/' + stack.slice(0, -1).join('/');
      const parentNode = fsTree[parentPath];
      if (parentNode && parentNode.children) {
        const match = parentNode.children.find(c => c.toLowerCase() === lastPart.toLowerCase());
        if (match) {
          const actualPath = parentPath === '/' ? '/' + match : parentPath + '/' + match;
          if (fsTree[actualPath]) {
            return { ok: true, path: actualPath, node: fsTree[actualPath] };
          }
        }
      }
    }
    
    return { ok: false, message: `${rawPath}: No such file or directory` };
  }

  function checkPerms(path, op) {
    if (kernelSessionRef && kernelSessionRef.isRoot) return true;
    if (path.startsWith('/root') || path.includes('/etc/shadow')) {
      return false;
    }
    return true;
  }

  window.kernelFS = {
    init(snapshot) {
      fsTree = snapshot || {};
      cwd = '/home/kali';
      prevDir = '/home/kali';
    },

    pwd() {
      return cwd;
    },

    cd(path) {
      // Handle array inputs from dispatcher
      if (Array.isArray(path)) {
        path = path[0];
      }
      if (path === '-') {
        const temp = cwd;
        cwd = prevDir;
        prevDir = temp;
        return { ok: true, message: '' };
      }

      const target = path || '/home/kali';
      const res = resolvePath(target);
      
      if (!res.ok) {
        return { ok: false, message: `cd: ${res.message}` };
      }

      if (res.node.type !== 'dir') {
        return { ok: false, message: `cd: ${target}: Not a directory` };
      }

      prevDir = cwd;
      cwd = res.path;
      
      // Update kernel session if available
      if (kernelSessionRef) {
        kernelSessionRef.cwd = cwd;
      }
      
      return { ok: true, message: '' };
    },

    ls(args) {
      let target = args.find(a => !a.startsWith('-'));
      if (!target) target = '.';
      
      const detailed = args.includes('-l') || args.includes('-la');
      const all = args.includes('-a') || args.includes('-la');
      
      const res = resolvePath(target);
      if (!res.ok) {
        return { ok: false, message: `ls: ${res.message}`, out: [] };
      }

      const node = res.node;
      if (node.type !== 'dir') {
        return { ok: false, message: `ls: cannot access '${target}': Not a directory`, out: [] };
      }

      let children = node.children || [];
      if (!all) {
        children = children.filter(c => !c.startsWith('.'));
      }

      if (detailed) {
        const out = [];
        children.forEach(name => {
          const childPath = res.path === '/' ? '/' + name : res.path + '/' + name;
          const childNode = fsTree[childPath];
          if (!childNode) {
            out.push(`?rw-r--r-- 1 ${session.user} ${session.user}    0 ${new Date().toISOString().split('T')[0]} ${name}`);
            return;
          }
          
          if (childNode.type === 'file') {
            out.push(`-rw-r--r-- 1 ${session.user} ${session.user} ${childNode.size || 1024} ${new Date(childNode.mtime || Date.now()).toISOString().split('T')[0]} ${name}`);
          } else if (childNode.type === 'dir') {
            out.push(`drwxr-xr-x 2 ${session.user} ${session.user} 4096 ${new Date(childNode.mtime || Date.now()).toISOString().split('T')[0]} ${name}`);
          }
        });
        return { ok: true, out };
      }

      return { ok: true, out: [children.join('  ')] };
    },

    cat(args) {
      const target = args[0];
      if (!target) {
        return { ok: false, message: 'Usage: cat <file>', out: [] };
      }

      const res = resolvePath(target);
      if (!res.ok) {
        return { ok: false, message: `cat: ${res.message}`, out: [] };
      }

      if (res.node.type === 'dir') {
        return { ok: false, message: `cat: ${target}: Is a directory`, out: [] };
      }

      const content = res.node.content || '';
      return { ok: true, out: content.split('\n') };
    },

    touch(args) {
      const target = args[0];
      if (!target) {
        return { ok: false, message: 'Usage: touch <file>' };
      }

      const res = resolvePath(target);
      if (!res.ok) {
        // Create parent directory chain if needed
        const parts = target.split('/').filter(p => p);
        const fileName = parts.pop();
        const dirPath = '/' + parts.join('/');
        
        if (!fsTree[dirPath]) {
          return { ok: false, message: `touch: cannot touch '${target}': No such file or directory` };
        }

        const parentNode = fsTree[dirPath];
        if (parentNode && parentNode.children) {
          parentNode.children.push(fileName);
          const fullPath = dirPath === '/' ? '/' + fileName : dirPath + '/' + fileName;
          fsTree[fullPath] = { type: 'file', content: '', mtime: Date.now() };
          return { ok: true, message: '' };
        }
      }

      if (res.node && res.node.type === 'file') {
        res.node.mtime = Date.now();
        return { ok: true, message: '' };
      }

      return { ok: true, message: '' };
    },

    mkdir(args) {
      const target = args[0];
      if (!target) {
        return { ok: false, message: 'Usage: mkdir <directory>' };
      }

      const res = resolvePath(target);
      if (res.ok) {
        return { ok: false, message: `mkdir: cannot create directory '${target}': File exists` };
      }

      // Create directory
      const parts = target.split('/').filter(p => p);
      const dirName = parts.pop();
      const parentPath = '/' + parts.join('/');
      
      if (!fsTree[parentPath]) {
        return { ok: false, message: `mkdir: cannot create directory '${target}': No such file or directory` };
      }

      const parentNode = fsTree[parentPath];
      if (!parentNode.children) parentNode.children = [];
      parentNode.children.push(dirName);
      
      const newDirPath = parentPath === '/' ? '/' + dirName : parentPath + '/' + dirName;
      fsTree[newDirPath] = { type: 'dir', children: [], mtime: Date.now() };
      
      return { ok: true, message: '' };
    },

    rmdir(args) {
      const target = args[0];
      if (!target) {
        return { ok: false, message: 'Usage: rmdir <directory>' };
      }

      const res = resolvePath(target);
      if (!res.ok) {
        return { ok: false, message: `rmdir: ${res.message}` };
      }

      if (res.node.type !== 'dir') {
        return { ok: false, message: `rmdir: failed to remove '${target}': Not a directory` };
      }

      if (res.node.children && res.node.children.length > 0) {
        return { ok: false, message: `rmdir: failed to remove '${target}': Directory not empty` };
      }

      // Remove from parent
      const parts = res.path.split('/').filter(p => p);
      const dirName = parts.pop();
      const parentPath = '/' + parts.join('/');
      
      if (fsTree[parentPath] && fsTree[parentPath].children) {
        fsTree[parentPath].children = fsTree[parentPath].children.filter(c => c !== dirName);
      }

      delete fsTree[res.path];
      return { ok: true, message: '' };
    },

    rm(args) {
      const target = args[0];
      if (!target) {
        return { ok: false, message: 'Usage: rm <file>' };
      }

      const res = resolvePath(target);
      if (!res.ok) {
        return { ok: false, message: `rm: ${res.message}` };
      }

      if (res.node.type === 'dir') {
        return { ok: false, message: `rm: cannot remove '${target}': Is a directory` };
      }

      // Remove from parent
      const parts = res.path.split('/').filter(p => p);
      const fileName = parts.pop();
      const parentPath = '/' + parts.join('/');
      
      if (fsTree[parentPath] && fsTree[parentPath].children) {
        fsTree[parentPath].children = fsTree[parentPath].children.filter(c => c !== fileName);
      }

      delete fsTree[res.path];
      return { ok: true, message: '' };
    },

    isDir(path) {
      const res = resolvePath(path);
      return res.ok && res.node.type === 'dir';
    },

    tabCompletions(fragment) {
      const parts = fragment.split('/');
      const lastPart = parts[parts.length - 1];
      const basePath = parts.slice(0, -1).join('/') || cwd;
      
      const res = resolvePath(basePath);
      if (!res.ok || res.node.type !== 'dir') return [];
      
      const children = res.node.children || [];
      return children.filter(name => 
        name.toLowerCase().startsWith(lastPart.toLowerCase())
      );
    },

    getSnapshot() {
      return fsTree;
    },

    setSession(s) {
      kernelSessionRef = s;
    },
    
    getCwd() {
      return cwd;
    }
  };

  console.info('[KernelFS] Module loaded');
})();

