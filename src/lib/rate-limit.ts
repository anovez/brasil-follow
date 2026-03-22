// Rate limiter using Map with TTL
// Cleanup runs every 5 minutes to prevent memory leaks

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export const RATE_LIMITS = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  forgotPassword: { maxRequests: 3, windowMs: 15 * 60 * 1000 },
  api: { maxRequests: 60, windowMs: 60 * 1000 },
  createOrder: { maxRequests: 10, windowMs: 60 * 1000 },
  addFunds: { maxRequests: 5, windowMs: 5 * 60 * 1000 },
  cron: { maxRequests: 1, windowMs: 30 * 1000 },
  general: { maxRequests: 200, windowMs: 60 * 1000 },
} as const

export function checkRateLimit(key: string, config: RateLimitConfig): { success: boolean; retryAfter: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, retryAfter: 0 }
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { success: false, retryAfter }
  }

  entry.count++
  return { success: true, retryAfter: 0 }
}

export function rateLimitResponse(retryAfter: number) {
  return Response.json(
    { error: `Muitas tentativas. Aguarde ${retryAfter} segundos.` },
    { status: 429, headers: { 'Retry-After': String(retryAfter) } }
  )
}
