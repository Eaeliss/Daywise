import '../global.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { Slot, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import * as Notifications from 'expo-notifications'
import React, { useEffect } from 'react'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useAuth } from '@/hooks/use-auth'
import { useDeepLink } from '@/hooks/use-deep-link'
import { queryClient } from '@/lib/query-client'
import { initSentry, Sentry } from '@/lib/sentry'
import { useOnboardingStore } from '@/stores/onboarding-store'

SplashScreen.preventAutoHideAsync()
initSentry()

function RootLayout() {
  const router = useRouter()
  const segments = useSegments()
  const { session, initialized, isPasswordRecovery } = useAuth()
  const onboardingCompleted = useOnboardingStore((s) => s.completed)
  useDeepLink()

  // Navigate to the relevant screen when the user taps a push notification
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const id = response.notification.request.identifier
      if (id === 'habit-reminder') {
        router.push('/(tabs)/habits')
      } else if (id.startsWith('goal-')) {
        router.push('/(tabs)/goals')
      }
    })
    return () => sub.remove()
  }, [])

  // Hide splash screen as soon as auth state is known
  useEffect(() => {
    if (initialized) {
      SplashScreen.hideAsync().catch((err) => Sentry.captureException(err))
    }
  }, [initialized])

  // Route based on auth state — deps include segments (no stale closure) and initialized (no premature redirect)
  useEffect(() => {
    if (!initialized) return
    if (!segments.length) return // Expo Router hasn't resolved the initial route yet

    const inAuthGroup = segments[0] === 'auth'
    const inOnboarding = segments[0] === 'onboarding'
    const onResetPassword = segments[1] === 'reset-password'

    if (isPasswordRecovery) {
      if (!inAuthGroup || !onResetPassword) router.replace('/auth/reset-password')
      return
    }

    if (!session && !inAuthGroup) {
      router.replace('/auth/sign-in')
    } else if (session && inAuthGroup) {
      if (!onboardingCompleted) router.replace('/onboarding')
      else router.replace('/(tabs)/dashboard')
    } else if (session && !inOnboarding && !onboardingCompleted) {
      router.replace('/onboarding')
    }
  }, [session, initialized, segments, isPasswordRecovery])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Slot />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default Sentry.wrap(RootLayout)
