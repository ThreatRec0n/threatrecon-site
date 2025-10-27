const { randomUUID } = require('crypto');

let pg;
const useDb = !!process.env.DATABASE_URL;

async function getClient() {
  if (!useDb) return null;
  if (!pg) pg = require('pg');
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

const mem = {
  sessions: new Map(),        // id -> {id,title,scenario_id,status,created_at}
  participants: new Map(),    // id -> {id,session_id,name,role,joined_at}
  events: new Map()           // session_id -> [{...}]
};

async function init() {
  if (!useDb) {
    console.warn('[STORE] Using in-memory store (no DATABASE_URL). This is for LOCAL DEV only.');
    return;
  }
  const client = await getClient();
  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT,
      scenario_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS participants (
      id UUID PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      ts TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      type TEXT NOT NULL,
      author TEXT,
      role TEXT,
      severity TEXT,
      message TEXT NOT NULL,
      payload JSONB
    );
  `);
  await client.end();
}

async function createSession({ id, title, scenario_id }) {
  id = id || `session-${Date.now()}`;
  if (!useDb) {
    mem.sessions.set(id, { id, title: title || 'Live Drill', scenario_id: scenario_id || null, status: 'active', created_at: new Date().toISOString() });
    if (!mem.events.has(id)) mem.events.set(id, []);
    return mem.sessions.get(id);
  }
  const client = await getClient();
  await client.query('INSERT INTO sessions (id, title, scenario_id) VALUES ($1,$2,$3)', [id, title || 'Live Drill', scenario_id || null]);
  const res = await client.query('SELECT * FROM sessions WHERE id=$1', [id]);
  await client.end();
  return res.rows[0];
}

async function getSession(id) {
  if (!useDb) return mem.sessions.get(id) || null;
  const client = await getClient();
  const r = await client.query('SELECT * FROM sessions WHERE id=$1', [id]);
  await client.end();
  return r.rows[0] || null;
}

async function endSession(id) {
  if (!useDb) {
    const s = mem.sessions.get(id);
    if (!s) return null;
    s.status = 'ended';
    return s;
  }
  const client = await getClient();
  await client.query('UPDATE sessions SET status=$2 WHERE id=$1', [id, 'ended']);
  const r = await client.query('SELECT * FROM sessions WHERE id=$1', [id]);
  await client.end();
  return r.rows[0] || null;
}

async function addParticipant({ session_id, name, role }) {
  const id = randomUUID();
  const row = { id, session_id, name, role, joined_at: new Date().toISOString() };
  if (!useDb) {
    mem.participants.set(id, row);
    return row;
  }
  const client = await getClient();
  await client.query(
    'INSERT INTO participants (id, session_id, name, role) VALUES ($1,$2,$3,$4)',
    [id, session_id, name, role]
  );
  const r = await client.query('SELECT * FROM participants WHERE id=$1', [id]);
  await client.end();
  return r.rows[0];
}

async function listParticipants(session_id) {
  if (!useDb) return [...mem.participants.values()].filter(p => p.session_id === session_id);
  const client = await getClient();
  const r = await client.query('SELECT * FROM participants WHERE session_id=$1 ORDER BY joined_at', [session_id]);
  await client.end();
  return r.rows;
}

async function addEvent({ session_id, type, author, role, severity, message, payload }) {
  const id = randomUUID();
  const row = { id, session_id, ts: new Date().toISOString(), type, author, role, severity, message, payload: payload || null };
  if (!useDb) {
    if (!mem.events.has(session_id)) mem.events.set(session_id, []);
    mem.events.get(session_id).push(row);
    return row;
  }
  const client = await getClient();
  await client.query(
    'INSERT INTO events (id, session_id, type, author, role, severity, message, payload) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, session_id, type, author || null, role || null, severity || null, message, payload || null]
  );
  const r = await client.query('SELECT * FROM events WHERE id=$1', [id]);
  await client.end();
  return r.rows[0];
}

async function listEvents(session_id, sinceISO) {
  if (!useDb) {
    const arr = mem.events.get(session_id) || [];
    if (!sinceISO) return arr;
    return arr.filter(e => new Date(e.ts) > new Date(sinceISO));
  }
  const client = await getClient();
  let r;
  if (sinceISO) {
    r = await client.query('SELECT * FROM events WHERE session_id=$1 AND ts > $2 ORDER BY ts', [session_id, sinceISO]);
  } else {
    r = await client.query('SELECT * FROM events WHERE session_id=$1 ORDER BY ts', [session_id]);
  }
  await client.end();
  return r.rows;
}

module.exports = {
  init,
  createSession,
  getSession,
  endSession,
  addParticipant,
  listParticipants,
  addEvent,
  listEvents,
};

