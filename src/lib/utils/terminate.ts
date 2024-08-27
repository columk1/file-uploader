import type { Server } from 'node:http'

interface TerminateOptions {
  coredump?: boolean
  timeout?: number
}

export default function terminate(
  server: Server,
  options: TerminateOptions = { coredump: false, timeout: 500 }
) {
  const exit = (code: number) => {
    if (options.coredump) {
      process.abort()
    } else {
      process.exit(code)
    }
  }

  return (code: number, reason: string) => (err?: Error, promise?: Promise<unknown>) => {
    if (err && err instanceof Error) {
      // Log error information, use a proper logging library here
      console.error(err.message, err.stack)
    }

    // Attempt a graceful shutdown
    server.close(() => exit(code))
    setTimeout(() => exit(code), options.timeout).unref()
  }
}
