// In-memory rate limiter: 10 requests per 60 seconds per authenticated user.
// Suitable for /api/ai/* routes in development; swap for redis-based limiter in production.

const windows = new Map();

const LIMIT = 10;
const WINDOW_MS = 60_000;

// Middleware that enforces an in-memory rate limit of 10 requests per 60 seconds.
// The key is the authenticated user's ID when available, falling back to the client IP.
// Sets X-RateLimit-Limit and X-RateLimit-Remaining response headers on every request.
// Returns 429 once the limit is exceeded until the window resets.
export const aiRateLimit = (req, res, next) => {
  const key = req.user?._id?.toString() ?? req.ip;
  const now = Date.now();
  const entry = windows.get(key) ?? { count: 0, resetAt: now + WINDOW_MS };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + WINDOW_MS;
  }

  entry.count += 1;
  windows.set(key, entry);

  res.setHeader('X-RateLimit-Limit', LIMIT);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, LIMIT - entry.count));

  if (entry.count > LIMIT) {
    return res.status(429).json({
      message: 'Too many AI requests — please wait a minute and try again.',
    });
  }

  next();
};
