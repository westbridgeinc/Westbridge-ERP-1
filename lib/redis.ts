/**
 * Redis client for rate limiting and future use.
 * REDIS_URL defaults to redis://localhost:6380 (matches docker-compose).
 */

import Redis from "ioredis";

const url = process.env.REDIS_URL ?? "redis://localhost:6380";
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (process.env.NODE_ENV === "production" && !process.env.REDIS_PASSWORD) {
    throw new Error("REDIS_PASSWORD is required in production");
  }
  if (redis) return redis;
  try {
    redis = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
    return redis;
  } catch {
    return null;
  }
}

export { getRedis };
