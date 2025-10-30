import http from 'node:http';

function fetchOnce(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
  });
}

(async () => {
  const url = process.env.SMOKE_URL || 'http://localhost:3000';
  try {
    const res = await fetchOnce(url);
    const ok = res.status === 200 && /THREATRECON|ThreatRecon Packet Hunt/i.test(res.body);
    console.log(`GET ${url} -> ${res.status} ${ok ? 'OK' : 'MISSING TITLE'}`);
    if (!ok) process.exit(1);
  } catch (e) {
    console.error('Smoke request failed:', e.message);
    process.exit(1);
  }
})();


