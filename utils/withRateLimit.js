// utils/withRateLimit.js

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create a Redis connection
let redis;
let ratelimit;

// Initialize the rate limiter
const initRateLimit = () => {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "ratelimit",
    });
  }

  return ratelimit;
};

// HOC to wrap API routes with rate limiting
export function withRateLimit(handler) {
  return async (req, res) => {
    // Skip rate limiting for non-mutation operations
    if (req.method === 'GET') {
      return handler(req, res);
    }

    try {
      const limiter = initRateLimit();
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      
      // Use IP + route as identifier for more granular control
      const identifier = `${ip}:${req.url}`;
      
      const { success, limit, reset, remaining } = await limiter.limit(identifier);
      
      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", remaining);
      res.setHeader("X-RateLimit-Reset", reset);
      
      if (!success) {
        return res.status(429).json({
          success: false,
          message: "Too many requests. Please try again later.",
        });
      }
      
      // If the rate limit check passes, proceed with the API request
      return handler(req, res);
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fall back to allowing the request if rate limiting fails
      return handler(req, res);
    }
  };
}
