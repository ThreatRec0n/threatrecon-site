const requestsByIp: Map<string, { dayCount: number; minuteCount: number; dayReset: number; minuteReset: number }> = new Map();

const DAY_LIMIT = Number(process.env.RATE_DAY || 50);
const MINUTE_LIMIT = Number(process.env.RATE_MINUTE || 3);

export function checkRateLimit(ip: string) {
  const now = Date.now();
  const cur = requestsByIp.get(ip) || { dayCount: 0, minuteCount: 0, dayReset: now + 86_400_000, minuteReset: now + 60_000 };
  if (now > cur.dayReset) { cur.dayCount = 0; cur.dayReset = now + 86_400_000; }
  if (now > cur.minuteReset) { cur.minuteCount = 0; cur.minuteReset = now + 60_000; }
  cur.dayCount += 1;
  cur.minuteCount += 1;
  requestsByIp.set(ip, cur);
  return {
    allowed: cur.dayCount <= DAY_LIMIT && cur.minuteCount <= MINUTE_LIMIT,
    remainingMinute: Math.max(0, MINUTE_LIMIT - cur.minuteCount),
    remainingDay: Math.max(0, DAY_LIMIT - cur.dayCount),
  };
}
