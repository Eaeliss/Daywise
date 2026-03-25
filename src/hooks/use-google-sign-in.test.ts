import { renderHook, act } from '@testing-library/react-native'
import { useGoogleSignIn } from './use-google-sign-in'

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'lifeplanapp://auth/callback'),
}))
jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  maybeCompleteAuthSession: jest.fn(),
}))
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      setSession: jest.fn(),
    },
  },
}))
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))

import * as WebBrowser from 'expo-web-browser'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

describe('useGoogleSignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls signInWithOAuth with correct params', async () => {
    const mockSignInWithOAuth = jest.mocked(supabase.auth.signInWithOAuth)
    mockSignInWithOAuth.mockResolvedValue({ data: { url: null, provider: 'google' }, error: null } as any)

    const { result } = renderHook(() => useGoogleSignIn())
    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockSignInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.any(String),
        skipBrowserRedirect: true,
      },
    })
  })

  it('calls setSession with tokens when result.type is success with valid tokens', async () => {
    const mockSignInWithOAuth = jest.mocked(supabase.auth.signInWithOAuth)
    const mockOpenAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync)
    const mockSetSession = jest.mocked(supabase.auth.setSession)

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth', provider: 'google' },
      error: null,
    } as any)
    mockOpenAuthSession.mockResolvedValue({
      type: 'success',
      url: 'lifeplanapp://auth/callback#access_token=abc123&refresh_token=xyz789',
    } as any)
    mockSetSession.mockResolvedValue({ data: { session: null, user: null }, error: null } as any)

    const { result } = renderHook(() => useGoogleSignIn())
    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'abc123',
      refresh_token: 'xyz789',
    })
  })

  it('does NOT call setSession when result.type is cancel', async () => {
    const mockSignInWithOAuth = jest.mocked(supabase.auth.signInWithOAuth)
    const mockOpenAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync)
    const mockSetSession = jest.mocked(supabase.auth.setSession)

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth', provider: 'google' },
      error: null,
    } as any)
    mockOpenAuthSession.mockResolvedValue({ type: 'cancel' } as any)

    const { result } = renderHook(() => useGoogleSignIn())
    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockSetSession).not.toHaveBeenCalled()
  })

  it('does NOT call setSession when result.type is dismiss', async () => {
    const mockSignInWithOAuth = jest.mocked(supabase.auth.signInWithOAuth)
    const mockOpenAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync)
    const mockSetSession = jest.mocked(supabase.auth.setSession)

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth', provider: 'google' },
      error: null,
    } as any)
    mockOpenAuthSession.mockResolvedValue({ type: 'dismiss' } as any)

    const { result } = renderHook(() => useGoogleSignIn())
    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockSetSession).not.toHaveBeenCalled()
  })

  it('does NOT call openAuthSessionAsync when signInWithOAuth returns error', async () => {
    const mockSignInWithOAuth = jest.mocked(supabase.auth.signInWithOAuth)
    const mockOpenAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync)

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: null, provider: 'google' },
      error: { message: 'OAuth error' },
    } as any)

    const { result } = renderHook(() => useGoogleSignIn())
    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(mockOpenAuthSession).not.toHaveBeenCalled()
  })

  it('does NOT call router.replace after successful sign-in — routing delegated to _layout.tsx (P-02)', async () => {
    const mockSignInWithOAuth = jest.mocked(supabase.auth.signInWithOAuth)
    const mockOpenAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync)
    const mockSetSession = jest.mocked(supabase.auth.setSession)

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth', provider: 'google' },
      error: null,
    } as any)
    mockOpenAuthSession.mockResolvedValue({
      type: 'success',
      url: 'lifeplanapp://auth/callback#access_token=abc123&refresh_token=xyz789',
    } as any)
    mockSetSession.mockResolvedValue({ data: { session: null, user: null }, error: null } as any)

    const { result } = renderHook(() => useGoogleSignIn())
    await act(async () => {
      await result.current.signInWithGoogle()
    })

    expect(jest.mocked(router.replace)).not.toHaveBeenCalled()
  })

  it('resets loading and does not navigate when setSession returns error (P-01)', async () => {
    const mockSignInWithOAuth = jest.mocked(supabase.auth.signInWithOAuth)
    const mockOpenAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync)
    const mockSetSession = jest.mocked(supabase.auth.setSession)

    mockSignInWithOAuth.mockResolvedValue({
      data: { url: 'https://accounts.google.com/o/oauth2/auth', provider: 'google' },
      error: null,
    } as any)
    mockOpenAuthSession.mockResolvedValue({
      type: 'success',
      url: 'lifeplanapp://auth/callback#access_token=abc123&refresh_token=xyz789',
    } as any)
    mockSetSession.mockResolvedValue({
      data: { session: null, user: null },
      error: { message: 'Session error' },
    } as any)

    const { result } = renderHook(() => useGoogleSignIn())
    await act(async () => {
      await result.current.signInWithGoogle()
    })

    // setSession was called — error return does not throw, loading resets via finally (AC3: silent)
    expect(mockSetSession).toHaveBeenCalledWith({ access_token: 'abc123', refresh_token: 'xyz789' })
    expect(result.current.loading).toBe(false)
  })
})
