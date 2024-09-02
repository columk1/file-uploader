import type { HelmetOptions } from 'helmet'

export const helmetConfig: HelmetOptions = {
  contentSecurityPolicy:
    process.env.NODE_ENV !== 'production'
      ? false
      : {
          directives: {
            'default-src': ["'self'", 'data:'],
            'script-src': ["'self'"],
            'img-src': ["'self'", 'https://fav.farm'],
          },
        },
}
