import { renderHook, act } from '@testing-library/react-native'
import { usePasskeyRegister, usePasskeySignIn } from './use-passkey'

jest.mock('react-native-passkey', () => ({
  Passkey: {
    isSupported: jest.fn(),
    create: jest.fn(),
    get: jest.fn(),
  },
}))
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      setSession: jest.fn(),
    },
  },
}))
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))

global.fetch = jest.fn()

import { Passkey } from 'react-native-passkey'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

const mockSession = {
  user: { id: 'user-123' },
  access_token: 'access-token-abc',
}

describe('usePasskeyRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls challenge and verify Edge Functions with correct params on success', async () => {
    const mockIsSupported = jest.mocked(Passkey.isSupported)
    const mockCreate = jest.mocked(Passkey.create)
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockIsSupported.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)

    const mockOptions = { challenge: 'challenge-xyz', rp: { id: 'localhost' } }
    const mockCredentialResponse = { id: 'cred-id', type: 'public-key' }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOptions),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any)

    mockCreate.mockResolvedValue(mockCredentialResponse as any)

    const { result } = renderHook(() => usePasskeyRegister())
    await act(async () => {
      await result.current.register()
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    // First call: challenge endpoint
    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('webauthn-challenge'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'registration', userId: 'user-123' }),
      }),
    )
    expect(mockCreate).toHaveBeenCalledWith(mockOptions)
    // Second call: verify endpoint
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('webauthn-verify'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          type: 'registration',
          response: mockCredentialResponse,
          userId: 'user-123',
        }),
      }),
    )
  })

  it('does NOT call Edge Functions when Passkey.create throws (user cancels)', async () => {
    const mockIsSupported = jest.mocked(Passkey.isSupported)
    const mockCreate = jest.mocked(Passkey.create)
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockIsSupported.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)

    const mockOptions = { challenge: 'challenge-xyz' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockOptions),
    } as any)

    mockCreate.mockRejectedValue(new Error('user cancel'))

    const { result } = renderHook(() => usePasskeyRegister())
    await act(async () => {
      await result.current.register()
    })

    // Only challenge call was made; verify was NOT called
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call Edge Functions when not signed in', async () => {
    const mockIsSupported = jest.mocked(Passkey.isSupported)
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockIsSupported.mockResolvedValue(true)
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null } as any)

    const { result } = renderHook(() => usePasskeyRegister())
    await act(async () => {
      await result.current.register()
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })
})

describe('usePasskeySignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls setSession with access_token on full success path', async () => {
    const mockIsSupported = jest.mocked(Passkey.isSupported)
    const mockGet = jest.mocked(Passkey.get)
    const mockSetSession = jest.mocked(supabase.auth.setSession)
    const mockFetch = jest.mocked(global.fetch)

    mockIsSupported.mockResolvedValue(true)

    const mockOptions = { challenge: 'challenge-xyz', rpId: 'localhost' }
    const mockAssertionResponse = { id: 'cred-id', type: 'public-key' }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOptions),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'jwt-token-xyz' }),
      } as any)

    mockGet.mockResolvedValue(mockAssertionResponse as any)
    mockSetSession.mockResolvedValue({ data: { session: null, user: null }, error: null } as any)

    const { result } = renderHook(() => usePasskeySignIn())
    await act(async () => {
      await result.current.signIn()
    })

    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: 'jwt-token-xyz',
      refresh_token: '',
    })
  })

  it('does NOT call setSession when Passkey.get throws (user cancels)', async () => {
    const mockIsSupported = jest.mocked(Passkey.isSupported)
    const mockGet = jest.mocked(Passkey.get)
    const mockSetSession = jest.mocked(supabase.auth.setSession)
    const mockFetch = jest.mocked(global.fetch)

    mockIsSupported.mockResolvedValue(true)

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ challenge: 'challenge-xyz' }),
    } as any)

    mockGet.mockRejectedValue(new Error('user cancel'))

    const { result } = renderHook(() => usePasskeySignIn())
    await act(async () => {
      await result.current.signIn()
    })

    expect(mockSetSession).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call setSession when verify Edge Function fails', async () => {
    const mockIsSupported = jest.mocked(Passkey.isSupported)
    const mockGet = jest.mocked(Passkey.get)
    const mockSetSession = jest.mocked(supabase.auth.setSession)
    const mockFetch = jest.mocked(global.fetch)

    mockIsSupported.mockResolvedValue(true)

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ challenge: 'challenge-xyz' }),
      } as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as any)

    mockGet.mockResolvedValue({ id: 'cred-id', type: 'public-key' } as any)

    const { result } = renderHook(() => usePasskeySignIn())
    await act(async () => {
      await result.current.signIn()
    })

    expect(mockSetSession).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call router.replace after successful sign-in — routing delegated to _layout.tsx', async () => {
    const mockIsSupported = jest.mocked(Passkey.isSupported)
    const mockGet = jest.mocked(Passkey.get)
    const mockSetSession = jest.mocked(supabase.auth.setSession)
    const mockFetch = jest.mocked(global.fetch)

    mockIsSupported.mockResolvedValue(true)

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ challenge: 'challenge-xyz' }),
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'jwt-token-xyz' }),
      } as any)

    mockGet.mockResolvedValue({ id: 'cred-id', type: 'public-key' } as any)
    mockSetSession.mockResolvedValue({ data: { session: null, user: null }, error: null } as any)

    const { result } = renderHook(() => usePasskeySignIn())
    await act(async () => {
      await result.current.signIn()
    })

    expect(jest.mocked(router.replace)).not.toHaveBeenCalled()
  })
})
