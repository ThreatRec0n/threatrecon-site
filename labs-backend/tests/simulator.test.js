// simulator.test.js - Unit tests for simulator
const Simulator = require('../src/simulator');

describe('Simulator', () => {
  let simulator;

  beforeEach(() => {
    simulator = new Simulator();
    simulator.createSession('test-session-1');
  });

  test('creates session successfully', () => {
    const session = simulator.getSession('test-session-1');
    expect(session).toBeDefined();
    expect(session.id).toBe('test-session-1');
    expect(session.user).toBe('kali');
  });

  test('handles pwd command', () => {
    const result = simulator.execCommand('pwd', 'test-session-1');
    expect(result.type).toBe('output');
    expect(result.output).toContain('/home/kali');
  });

  test('handles whoami command', () => {
    const result = simulator.execCommand('whoami', 'test-session-1');
    expect(result.type).toBe('output');
    expect(result.output).toContain('kali');
  });

  test('handles id command', () => {
    const result = simulator.execCommand('id', 'test-session-1');
    expect(result.type).toBe('output');
    expect(result.output).toContain('uid=1000');
  });

  test('handles hostname command', () => {
    const result = simulator.execCommand('hostname', 'test-session-1');
    expect(result.type).toBe('output');
    expect(result.output).toContain('kali');
  });

  test('handles nmap command', () => {
    const result = simulator.execCommand('nmap -sV 10.0.10.5', 'test-session-1');
    expect(result.type).toBe('output');
    expect(result.output).toContain('Nmap');
    expect(result.output).toContain('open');
  });

  test('handles ping command', () => {
    const result = simulator.execCommand('ping 8.8.8.8', 'test-session-1');
    expect(result.type).toBe('output');
    expect(result.output).toContain('PING');
    expect(result.output).toContain('icmp_seq');
  });

  test('handles ifconfig command', () => {
    const result = simulator.execCommand('ifconfig', 'test-session-1');
    expect(result.type).toBe('output');
    expect(result.output).toContain('eth0');
    expect(result.output).toContain('inet');
  });

  test('handles unknown command', () => {
    const result = simulator.execCommand('xyz123', 'test-session-1');
    expect(result.type).toBe('unknown');
    expect(result.output).toContain('command not found');
  });

  test('handles empty command', () => {
    const result = simulator.execCommand('   ', 'test-session-1');
    expect(result.type).toBe('empty');
  });
});

