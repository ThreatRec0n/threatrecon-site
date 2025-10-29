// Random network helpers with secure seeding
// Client-side only; uses crypto.getRandomValues and localStorage for seed guard

function getCrypto() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) return crypto;
  // Fallback: not ideal, but keeps app running in non-secure envs
  return {
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    },
  };
}

export function randInt(min, max, prng) {
  if (prng) return Math.floor(prng() * (max - min + 1)) + min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick(array, prng) {
  return array[Math.floor((prng ? prng() : Math.random()) * array.length)];
}

export function sample(array, n, prng) {
  const copy = [...array];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    const idx = Math.floor((prng ? prng() : Math.random()) * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

export function privateIp(prng) {
  const which = randInt(0, 2, prng);
  if (which === 0) return `10.${randInt(0,255,prng)}.${randInt(0,255,prng)}.${randInt(1,254,prng)}`;
  if (which === 1) return `172.${randInt(16,31,prng)}.${randInt(0,255,prng)}.${randInt(1,254,prng)}`;
  return `192.168.${randInt(0,255,prng)}.${randInt(1,254,prng)}`;
}

export function publicIp(prng) {
  const blocks = [
    [13,64,11], [18,64,10], [34,192,10], [44,192,10], [52,0,8], [63,32,11], [80,0,6], [104,16,12], [142,250,15],
  ];
  const [baseA, baseB, cidr] = pick(blocks, prng);
  // crude derivation inside block
  const a = baseA;
  const b = baseB + randInt(0, Math.max(1, (1 << (16 - Math.max(8, cidr))) - 1), prng);
  const c = randInt(0, 255, prng);
  const d = randInt(1, 254, prng);
  return `${a}.${b}.${c}.${d}`;
}

export function fqdn(tldList = ['com','net','io','org'], prng) {
  const alpha = 'abcdefghijklmnopqrstuvwxyz';
  const label = () => Array.from({ length: randInt(4, 10, prng) }, () => alpha[randInt(0, alpha.length-1, prng)]).join('');
  const numLabels = randInt(2, 4, prng);
  const labels = Array.from({ length: numLabels }, label);
  return `${labels.join('.')}.${pick(tldList, prng)}`;
}

export function uniqueId(prefix = 'id', prng) {
  const now = Date.now().toString(36);
  const rand = Math.floor((prng ? prng() : Math.random()) * 1e9).toString(36);
  return `${prefix}-${now}-${rand}`;
}

function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function recentSeedGuard(seed) {
  try {
    const key = 'tr_recent_seeds';
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    if (list.includes(seed)) {
      // mutate
      seed = (seed + 0x9E3779B9) >>> 0;
    }
    const next = [seed, ...list].slice(0, 20);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {}
  return seed;
}

export function makeSeed() {
  const c = getCrypto();
  const a = new Uint32Array(2);
  c.getRandomValues(a);
  const perf = typeof performance !== 'undefined' ? Math.floor(performance.now() * 1000) : 0;
  let seed = (a[0] ^ a[1] ^ (perf >>> 0)) >>> 0;
  seed = recentSeedGuard(seed);
  const prng = mulberry32(seed);
  return { seed, prng };
}


