import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), '.data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'cache.sqlite');

export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  input TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  ts INTEGER NOT NULL,
  actor TEXT,
  action TEXT,
  details TEXT
);
`);

export function setCache(key: string, value: unknown) {
  const stmt = db.prepare('REPLACE INTO cache (key, value, created_at) VALUES (?, ?, ?)');
  stmt.run(key, JSON.stringify(value), Date.now());
}

export function getCache(key: string): any | undefined {
  const row = db.prepare('SELECT value, created_at FROM cache WHERE key = ?').get(key) as { value: string; created_at: number } | undefined;
  if (!row) return undefined;
  try { return JSON.parse(row.value); } catch { return undefined; }
}
