const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMITS = {
  '/api/auth/login': { limit: 5, windowMs: 60 * 1000 },
  '/api/auth/signup': { limit: 3, windowMs: 60 * 1000 },
  '/api/webhooks/stripe': { limit: 20, windowMs: 60 * 1000 },
  '/api/cron': { limit: 10, windowMs: 60 * 1000 },
  '/p/': { limit: 30, windowMs: 60 * 1000 },
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  rateLimitStore.set(key, record)

  return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime }
}

export function getRateLimitConfig(pathname: string) {
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(pattern)) {
      return config
    }
  }
  return null
}

setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000)

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
  return ip
}
