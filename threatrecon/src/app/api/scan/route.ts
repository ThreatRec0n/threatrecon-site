import { NextRequest } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/server/rateLimit';
import { getCache, setCache } from '@/server/db';
import { adapters as registry, registerAdapter } from '@/../packages/scanners';
import { allAdapters } from '@/../packages/scanners/registry';
import type { CandidateRecord, ScanInput, SiteAdapter } from '@/lib/types';
import { politeGet } from '@/lib/http';
import { evaluateCandidates } from '@/../packages/scanners/site-utils';

// Register all adapters on import
for (const a of allAdapters) registerAdapter(a as unknown as SiteAdapter);

const InputSchema = z.object({
  type: z.enum(['name','email','phone','address','username']),
  fullName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  streetAddress: z.string().optional(),
  username: z.string().optional(),
});

function cacheKey(input: ScanInput, site: string) {
  return `v1:${site}:${JSON.stringify(input)}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const { allowed, remainingMinute } = checkRateLimit(ip);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded', retryAfterSeconds: Math.max(1, Math.ceil(60 * (1-remainingMinute/3))) }), { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });

  const input = parsed.data as ScanInput;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      controller.enqueue(encoder.encode('event: open\n\n'));

      const sites = Object.keys(registry);
      write({ type: 'start', sites });

      for (const site of sites) {
        try {
          const key = cacheKey(input, site);
          const cached = getCache(key) as CandidateRecord[] | undefined;
          if (cached) {
            write({ type: 'site', site, status: 'cached', results: cached.map(r => ({ ...r, cacheHit: true })) });
            continue;
          }
          const adapter = registry[site];
          // Build polite queries
          const queries = await adapter.buildQueries(input);
          const candidates: any[] = [];
          let blocked = false;
          for (const q of queries) {
            const res = await politeGet(q.url);
            if ((res as any).blockedByRobots) { blocked = true; break; }
            if (!res.ok) continue;
            const html = await res.text();
            const items = await adapter.parse(html, q.url);
            candidates.push(...items);
          }
          if (blocked || queries.length === 0) {
            const soft: CandidateRecord = {
              site,
              matchedAttribute: input.type,
              confidence: 0.2,
              reason: 'Automated access disallowed or blocked; providing opt-out guidance only',
              soft: true,
              optOutUrl: adapter.metadata.optOutUrl,
            };
            setCache(key, [soft]);
            write({ type: 'site', site, status: 'blocked', results: [soft] });
            continue;
          }
          const results = evaluateCandidates(adapter, input, candidates);
          setCache(key, results);
          write({ type: 'site', site, status: 'ok', results });
        } catch (e: any) {
          write({ type: 'site', site, status: 'error', error: e?.message || 'unknown' });
        }
      }

      write({ type: 'done' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
