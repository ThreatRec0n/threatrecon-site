// kali_network.js - Network configuration simulation
(function() {
  'use strict';

  window.kali_network = {
    cmd_ifconfig(args, runtime, term) {
      const adapter = args[0] || 'eth0';
      
      // Initialize network state if needed
      if (!runtime.net) {
        runtime.net = {
          eth0: {
            ips: ['192.168.56.101'],
            mac: '02:42:ac:11:00:02',
            up: true,
            mtu: 1500
          }
        };
      }
      
      // Show all interfaces if no adapter specified
      if (args.length === 0) {
        Object.keys(runtime.net).forEach(iface => {
          this.cmd_ifconfig([iface], runtime, term);
        });
        return true;
      }
      
      if (!runtime.net[adapter]) {
        term.writeln(`${adapter}: error fetching interface information: Device not found`);
        return true;
      }
      
      const intf = runtime.net[adapter];
      const status = intf.up ? 'UP' : 'DOWN';
      term.writeln(`${adapter}: flags=4163<${status},BROADCAST,RUNNING,MULTICAST>  mtu ${intf.mtu}`);
      if (intf.ips && intf.ips.length > 0) {
        intf.ips.forEach(ip => {
          term.writeln(`    inet ${ip}  netmask 255.255.255.0  broadcast ${ip.split('.').slice(0,3).join('.')}.255`);
        });
      }
      if (intf.mac) {
        term.writeln(`    ether ${intf.mac}`);
      }
      term.writeln('');
      return true;
    },
    
    cmd_ip(args, runtime, term) {
      if (args.length < 2) {
        term.writeln('Usage: ip <command> <subcommand>');
        return true;
      }
      
      const subcmd = args[0];
      
      if (subcmd === 'addr') {
        if (args[1] === 'show') {
          if (!runtime.net) runtime.net = { eth0: { ips: ['192.168.56.101'], mac: '02:42:ac:11:00:02', up: true, mtu: 1500 } };
          Object.keys(runtime.net).forEach(adapter => {
            const intf = runtime.net[adapter];
            term.writeln(`${parseInt(adapter !== 'lo' ? '2' : '1')}: ${adapter}: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu ${intf.mtu} qdisc mq state UP group default qlen 1000`);
            if (intf.ips && intf.ips.length > 0) {
              intf.ips.forEach(ip => {
                term.writeln(`    inet ${ip}/24 brd ${ip.split('.').slice(0,3).join('.')}.255 scope global ${adapter}`);
              });
            }
            if (intf.mac) {
              term.writeln(`    link/ether ${intf.mac} brd ff:ff:ff:ff:ff:ff`);
            }
            term.writeln('');
          });
          return true;
        } else if (args[1] === 'add') {
          // ip addr add 192.168.56.111/24 dev eth0
          const ipWithCidr = args[2];
          const devIdx = args.indexOf('dev');
          const dev = devIdx >= 0 ? args[devIdx + 1] : 'eth0';
          
          if (!runtime.net) runtime.net = {};
          if (!runtime.net[dev]) {
            runtime.net[dev] = { ips: [], mac: '02:00:00:00:00:01', up: true, mtu: 1500 };
          }
          
          const ip = ipWithCidr.split('/')[0];
          if (!runtime.net[dev].ips) runtime.net[dev].ips = [];
          if (!runtime.net[dev].ips.includes(ip)) {
            runtime.net[dev].ips.push(ip);
          }
          
          term.writeln(`Added IP ${ipWithCidr} to ${dev}`);
          return true;
        } else if (args[1] === 'del') {
          const ipWithCidr = args[2];
          const devIdx = args.indexOf('dev');
          const dev = devIdx >= 0 ? args[devIdx + 1] : 'eth0';
          
          if (!runtime.net || !runtime.net[dev]) {
            term.writeln(`Cannot find device "${dev}"`);
            return true;
          }
          
          const ip = ipWithCidr.split('/')[0];
          if (runtime.net[dev].ips) {
            runtime.net[dev].ips = runtime.net[dev].ips.filter(i => i !== ip);
          }
          
          term.writeln(`Deleted IP ${ipWithCidr} from ${dev}`);
          return true;
        }
      } else if (subcmd === 'route') {
        if (args[1] === 'show' || args[1] === 'list') {
          term.writeln('default via 192.168.56.1 dev eth0 proto static metric 100');
          term.writeln('192.168.56.0/24 dev eth0 proto kernel scope link src 192.168.56.101');
          term.writeln('169.254.0.0/16 dev eth0 scope link metric 1000');
          return true;
        }
      }
      
      return false;
    },
    
    cmd_ping(args, term) {
      if (args.length === 0) {
        term.writeln('ping: usage error: Destination address required');
        return true;
      }
      
      const target = args[0];
      const count = args.includes('-c') ? parseInt(args[args.indexOf('-c') + 1]) || 4 : 4;
      
      term.writeln(`PING ${target} (${target}) 56(84) bytes of data.`);
      
      for (let i = 0; i < count; i++) {
        const time = (Math.random() * 10 + 5).toFixed(3);
        term.writeln(`64 bytes from ${target}: icmp_seq=${i+1} ttl=64 time=${time} ms`);
        // Simulate delay
        if (i < count - 1) {
          setTimeout(() => {}, 1000);
        }
      }
      
      term.writeln(`\n--- ${target} ping statistics ---`);
      term.writeln(`${count} packets transmitted, ${count} received, 0% packet loss, time ${count*1000}ms`);
      term.writeln(`rtt min/avg/max/mdev = 5.123/7.456/9.789/2.234 ms`);
      return true;
    }
  };

  console.info('[Kali] Network module loaded');
})();
