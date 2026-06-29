import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  beforeSend(event) {
    if (event.user) {
      delete event.user.email
      delete event.user.username
      delete event.user.ip_address
    }
    return event
  },
})
