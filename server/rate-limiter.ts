import { Request, Response, NextFunction } from 'express';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS_PER_IP, DAILY_GEMINI_BUDGET } from './config.ts';

interface IpRateRecord {
  count: number;
  resetTime: number;
}

const ipMap = new Map<string, IpRateRecord>();

// Clean up stale IP records every 5 minutes (unref so tests/scripts can exit cleanly)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipMap.entries()) {
    if (now > record.resetTime) {
      ipMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}

export function ipRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Extract client IP (handling reverse proxies like Cloud Run / AI Studio)
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = typeof forwardedFor === 'string'
    ? forwardedFor.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown-client';

  const now = Date.now();
  let record = ipMap.get(ip);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    ipMap.set(ip, record);
  } else {
    record.count++;
  }

  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS_PER_IP - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS_PER_IP.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', resetSeconds.toString());

  if (record.count > RATE_LIMIT_MAX_REQUESTS_PER_IP) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: `You have made too many requests. Please wait ${resetSeconds} seconds before trying again. (Limit: ${RATE_LIMIT_MAX_REQUESTS_PER_IP} req/min).`,
      retryAfterSeconds: resetSeconds,
    });
    return;
  }

  next();
}

/**
 * Daily Gemini Quota Guard
 * Tracks Gemini API calls across the entire server to protect from quota exhaustion.
 */
class DailyGeminiQuotaTracker {
  private count = 0;
  private currentDay = new Date().toISOString().slice(0, 10);

  private checkDayRollover(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.currentDay) {
      this.currentDay = today;
      this.count = 0;
    }
  }

  canConsume(callsNeeded = 1): boolean {
    this.checkDayRollover();
    return this.count + callsNeeded <= DAILY_GEMINI_BUDGET;
  }

  consume(callsCount = 1): void {
    this.checkDayRollover();
    this.count += callsCount;
  }

  getUsage(): { used: number; max: number; remaining: number; resetDay: string } {
    this.checkDayRollover();
    return {
      used: this.count,
      max: DAILY_GEMINI_BUDGET,
      remaining: Math.max(0, DAILY_GEMINI_BUDGET - this.count),
      resetDay: this.currentDay,
    };
  }
}

export const dailyQuotaTracker = new DailyGeminiQuotaTracker();
