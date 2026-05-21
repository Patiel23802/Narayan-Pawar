/** Lightweight in-memory rate limiter (no extra dependencies). */

const buckets = new Map();

function pruneBucket(bucket, now, windowMs) {
  while (bucket.length && bucket[0] <= now - windowMs) {
    bucket.shift();
  }
}

export function rateLimit({ windowMs = 15 * 60 * 1000, max = 30, keyFn }) {
  return (req, res, next) => {
    const key = keyFn(req) || req.ip || 'unknown';
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    pruneBucket(bucket, now, windowMs);
    if (bucket.length >= max) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }
    bucket.push(now);
    next();
  };
}
