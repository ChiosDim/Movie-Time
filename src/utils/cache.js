/**
 * Simple in-memory cache for OMDB API responses
 * In production, consider using Redis
 */
class Cache {
  constructor(ttl = 86400) {
    this.cache = new Map();
    this.ttl = ttl * 1000; // Convert to milliseconds
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const entry = this.cache.get(key);
    const isExpired = Date.now() - entry.timestamp > this.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

export default new Cache();
