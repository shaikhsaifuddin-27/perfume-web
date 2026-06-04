/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from './logger';

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

async function runRedisCommand(command: string[]): Promise<any> {
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.result;
  } catch (error) {
    logger.error('Redis command failed', error, { command });
    return null;
  }
}

async function runRedisPipeline(commands: string[][]): Promise<any> {
  if (!url || !token) return null;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (error) {
    logger.error('Redis pipeline failed', error, { commands });
    return null;
  }
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 900; // 15 minutes

export async function checkLockout(email: string, ip: string): Promise<{ locked: boolean; reason?: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const keys = [`lockout:email:${normalizedEmail}`, `lockout:ip:${ip}`];

  for (const key of keys) {
    const ttl = await runRedisCommand(['TTL', key]);
    if (ttl !== null && ttl > 0) {
      return {
        locked: true,
        reason: `Too many failed login attempts. Locked out for another ${Math.ceil(ttl / 60)} minutes.`,
      };
    }
  }

  return { locked: false };
}

export async function recordFailedAttempt(
  email: string,
  ip: string
): Promise<{ failedCount: number; delayMs: number }> {
  const normalizedEmail = email.toLowerCase().trim();
  const emailKey = `failed:email:${normalizedEmail}`;
  const ipKey = `failed:ip:${ip}`;

  const res = await runRedisPipeline([
    ['INCR', emailKey],
    ['EXPIRE', emailKey, '3600'],
    ['INCR', ipKey],
    ['EXPIRE', ipKey, '3600'],
  ]);

  const emailFailedCount = Number(res?.[0]?.result ?? 1);
  const ipFailedCount = Number(res?.[2]?.result ?? 1);
  const maxFailedCount = Math.max(emailFailedCount, ipFailedCount);

  if (emailFailedCount >= MAX_ATTEMPTS) {
    await runRedisCommand(['SET', `lockout:email:${normalizedEmail}`, '1', 'EX', String(LOCKOUT_SECONDS)]);
  }
  if (ipFailedCount >= MAX_ATTEMPTS) {
    await runRedisCommand(['SET', `lockout:ip:${ip}`, '1', 'EX', String(LOCKOUT_SECONDS)]);
  }

  // progressive delay: 1000 * 2^(failedCount - 1) capped at 10 seconds
  const delayMs = Math.min(1000 * Math.pow(2, maxFailedCount - 1), 10000);

  return { failedCount: maxFailedCount, delayMs };
}

export async function resetFailedAttempts(email: string, ip: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  await runRedisPipeline([
    ['DEL', `failed:email:${normalizedEmail}`],
    ['DEL', `failed:ip:${ip}`],
  ]);
}
