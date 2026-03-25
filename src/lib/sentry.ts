import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'

export const initSentry = () => {
  // P-07: read DSN from app.config.ts extra (reliable in EAS builds) not process.env
  const dsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    enabled: !__DEV__,
    tracesSampleRate: 0.1, // P-10: 100% sampling causes quota exhaustion; 10% for prod
  })
}

export { Sentry }
