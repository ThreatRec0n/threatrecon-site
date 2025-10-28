// dispatcher.js - Command dispatcher for Kali emulator
(function() {
  'use strict';

  function createDispatcher({ fs, proc, scenario, term, getPrompt }) {
    const history = [];

    async function run(line, ctx) {
      if (!line.trim()) return { ok: true, out: [] };

      history.push(line);
      
      // Parse command line
      const argv = line.match(/"[^"]*"|'[^']*'|\S+/g) || [];
      const cmd = argv[0];

      if (!cmd) return { ok: true, out: [] };

      const commandHandlers = {
        pwd: () => {
          const result = fs.pwd();
          return { ok: true, out: [result] };
        },

        cd: () => {
          const path = argv.slice(1);
          const result = fs.cd(path);
          if (result.ok) {
            const newCwd = fs.pwd();
            ctx.session.cwd = newCwd;
            // Also update the kernel session if available
            if (ctx.proc && ctx.proc.getSession) {
              const session = ctx.proc.getSession();
              session.cwd = newCwd;
            }
          }
          return result;
        },

        ls: () => {
          const result = fs.ls(argv.slice(1));
          if (!result.ok) {
            return { ok: false, out: [result.message] };
          }
          return { ok: true, out: result.out };
        },

        cat: () => fs.cat(argv.slice(1)),

        touch: () => {
          const result = fs.touch(argv.slice(1));
          if (!result.ok) {
            return { ok: false, out: [result.message] };
          }
          return { ok: true, out: [] };
        },

        rm: () => {
          const result = fs.rm(argv.slice(1));
          if (!result.ok) {
            return { ok: false, out: [result.message] };
          }
          return { ok: true, out: [] };
        },

        mkdir: () => {
          const result = fs.mkdir(argv.slice(1));
          if (!result.ok) {
            return { ok: false, out: [result.message] };
          }
          return { ok: true, out: [] };
        },

        rmdir: () => {
          const result = fs.rmdir(argv.slice(1));
          if (!result.ok) {
            return { ok: false, out: [result.message] };
          }
          return { ok: true, out: [] };
        },

        history: () => {
          const histOut = history.map((cmd, i) => `  ${i + 1}  ${cmd}`);
          return { ok: true, out: histOut };
        },

        whoami: () => proc.whoami(),

        id: () => proc.id(argv[1] || ctx.session.user),

        hostname: () => proc.hostname(),

        uname: () => proc.uname(argv),

        uptime: () => proc.uptime(),

        ifconfig: () => proc.ifconfig(),

        ip: () => proc.ip(argv),

        ping: () => proc.ping(argv.slice(1)),

        nmap: () => proc.nmap(argv.slice(1), scenario),

        ps: () => proc.ps(argv.slice(1)),

        top: () => proc.top(argv.slice(1)),

        sudo: () => {
          const result = proc.sudo(argv.slice(1), ctx.session);
          if (result.session) {
            ctx.session.user = result.session.user;
            ctx.session.isRoot = result.session.isRoot;
            ctx.session.cwd = result.session.cwd;
            // Update kernel proc session
            proc.getSession = () => ctx.session;
          }
          return result;
        },

        su: () => {
          const result = proc.su(argv.slice(1), ctx.session);
          if (result.session) {
            ctx.session.user = result.session.user;
            ctx.session.isRoot = result.session.isRoot;
            ctx.session.cwd = result.session.cwd;
            proc.getSession = () => ctx.session;
          }
          return result;
        },

        exit: () => {
          const result = proc.exitSession(argv.slice(1), ctx.session, ctx);
          if (result.session) {
            ctx.session = result.session;
            proc.getSession = () => ctx.session;
          }
          return result;
        },

        clear: () => ({ ok: true, out: [], type: 'control', action: 'clear' }),
      };

      const handler = commandHandlers[cmd];

      if (handler) {
        return await handler();
      }

      // Unknown command - forward to remote exec
      return await proc.remoteExec(line, ctx);
    }

    return { run };
  }

  window.createDispatcher = createDispatcher;
  console.info('[Dispatcher] Module loaded');
})();

