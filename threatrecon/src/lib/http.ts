import robotsParser from 'robots-parser';
import Bottleneck from 'bottleneck';
import { fetch } from 'undici';

const limiter = new Bottleneck({ maxConcurrent: 5, minTime: 500 });

const robotsCache = new Map<string, ReturnType<typeof robotsParser>>();

async function getRobots(url: string) {
  try {
    const u = new URL(url);
    const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
    if (robotsCache.has(robotsUrl)) return robotsCache.get(robotsUrl)!;
    const res = await fetch(robotsUrl, { method: 'GET' });
    if (!res.ok) throw new Error('robots fetch failed');
    const text = await res.text();
    const parser = robotsParser(robotsUrl, text);
    robotsCache.set(robotsUrl, parser);
    return parser;
  } catch (e) {
    return robotsParser('', '');
  }
}

export async function politeGet(url: string, userAgent = 'ThreatReconBot/1.0 (+https://threatrecon.io)') {
  const robots = await getRobots(url);
  const allowed = robots.isAllowed(url, userAgent) !== false;
  if (!allowed) {
    return { ok: false as const, status: 999, headers: {}, text: async () => '', blockedByRobots: true as const };
  }
  return limiter.schedule(async () => {
    const res = await fetch(url, { headers: { 'User-Agent': userAgent, 'Accept': 'text/html,application/xhtml+xml' } });
    return Object.assign(res, { blockedByRobots: false as const });
  });
}
