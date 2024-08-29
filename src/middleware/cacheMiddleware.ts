import cache from 'memory-cache'
import type { RequestHandler } from 'express'

// Cache duration in milliseconds (e.g., 5 seconds)
const cacheDuration = 5000

export const cacheMiddleware = (duration: number): RequestHandler => {
  return (req, res, next) => {
    const key = `__express__${req.originalUrl || req.url}`
    const cachedBody = cache.get(key)

    if (cachedBody) {
      console.log(`Serving cached page for ${req.url}`)
      res.send(cachedBody)
    } else {
      // Override the default res.send function
      const originalSend = res.send.bind(res)
      res.send = (body: string | Buffer | object) => {
        cache.put(key, body, duration)
        return originalSend(body)
      }
      next()
    }
  }
}
