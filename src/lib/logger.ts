/* eslint-disable @typescript-eslint/no-explicit-any */
type LogPayload = Record<string, any>;

function redactValue(key: string, val: any): any {
  if (typeof val === 'string') {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('key')
    ) {
      return '[REDACTED]';
    }
    if (lowerKey.includes('email')) {
      const parts = val.split('@');
      if (parts.length === 2) {
        const [local, domain] = parts;
        return `${local.charAt(0)}***@${domain}`;
      }
      return '[REDACTED]';
    }
    if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
      return val.length > 4 ? `${val.slice(0, 3)}***${val.slice(-2)}` : '[REDACTED]';
    }
  }
  return val;
}

function redactPayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload;
  if (Array.isArray(payload)) return payload.map(redactPayload);
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (val && typeof val === 'object') {
      result[key] = redactPayload(val);
    } else {
      result[key] = redactValue(key, val);
    }
  }
  return result;
}

export const logger = {
  info: (message: string, payload?: LogPayload) => {
    console.log(
      JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        payload: redactPayload(payload),
      })
    );
  },
  warn: (message: string, payload?: LogPayload) => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        payload: redactPayload(payload),
      })
    );
  },
  error: (message: string, error?: any, payload?: LogPayload) => {
    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        payload: redactPayload(payload),
      })
    );
  },
};
