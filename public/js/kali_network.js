// kali_network.js - Network configuration simulation
(function() {
  'use strict';

  window.kali_network = {
    cmd_ifconfig(args, runtime, term) {
      const adapter = args[0] || 'eth0';
      if (!runtime.net) runtime.net = { eth0: { ip: '192.168.56.101', mac: '02:42:ac:11:00:02' } };
      
      if (!runtime.net[adapter]) {
        term.writeln(`${adapter}: error fetching interface information: Device not found`);
        return true;
      }
      
      const intf = runtime.net[adapter];
      term.writeln(`${adapter}: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500`);
      term.writeln(`    inet ${intf.ip}  netmask 255.255.255.0  broadcast ${intf.ip.split('.').slice(0,3).join('.')}.255`);
      term.writeln(`    ether ${intf.mac}`);
      term.writeln('');
      return true;
    },
    
    cmd_ip(args, runtime, term) {
      if (args.length < 2) {
        term.writeln('Usage: ip <command>');
        return true;
      }
      
      const subcmd = args[0];
      
      if (subcmd === 'addr') {
        if (args[1] === 'show') {
          Object.keys(runtime.net || {}).forEach(adapter => {
            this.cmd_ifconfig([adapter], runtime, term);
          });
          return true;
        } else if (args[1] === 'add') {
          // ip addr add 192.168.56.111/24 dev eth0
          const ipWithCidr = args[2];
          const devIdx = args.indexOf('dev');
          const dev = args[devIdx + 1] || 'eth0';
          
          if (!runtime.net) runtime.net = {};
          if (!runtime.net[dev]) runtime.net[dev] = {};
          runtime.net[dev].ip = ipWithCidr.split('/')[0];
          term.writeln(`Added IP ${ipWithCidr} to ${dev}`);
          return true;
        }
      } else if (subcmd === 'route') {
        if (args[1] === 'show') {
          term.writeln('default via 192.168.56.1 dev eth0 proto static');
          term.writeln('192.168.56.0/24 dev eth0 proto kernel scope link');
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
