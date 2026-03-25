import { renderHook, act } from '@testing-library/react-native'
import { useDeleteAccount } from './use-delete-account'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))
jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))

global.fetch = jest.fn()

import { supabase } from '@/lib/supabase'

const mockSession = {
  user: { id: 'user-123', email: 'test@example.com' },
  access_token: 'access-token-abc',
}

describe('useDeleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls signInWithPassword, Edge Function, and signOut on correct password', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockSignIn = jest.mocked(supabase.auth.signInWithPassword)
    const mockSignOut = jest.mocked(supabase.auth.signOut)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    mockSignIn.mockResolvedValue({ data: {}, error: null } as any)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as any)
    mockSignOut.mockResolvedValue({ error: null } as any)

    const { result } = renderHook(() => useDeleteAccount())
    await act(async () => {
      await result.current.deleteAccount('correct-password')
    })

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'correct-password',
    })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('delete-account'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockSession.access_token}`,
        }),
      }),
    )
    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call Edge Function or signOut when password is wrong', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockSignIn = jest.mocked(supabase.auth.signInWithPassword)
    const mockSignOut = jest.mocked(supabase.auth.signOut)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    mockSignIn.mockResolvedValue({
      data: {},
      error: new Error('Invalid credentials'),
    } as any)

    const { result } = renderHook(() => useDeleteAccount())
    await act(async () => {
      await result.current.deleteAccount('wrong-password')
    })

    expect(mockSignIn).toHaveBeenCalledTimes(1)
    expect(mockFetch).not.toHaveBeenCalled()
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call signOut when Edge Function fails', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockSignIn = jest.mocked(supabase.auth.signInWithPassword)
    const mockSignOut = jest.mocked(supabase.auth.signOut)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    mockSignIn.mockResolvedValue({ data: {}, error: null } as any)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as any)

    const { result } = renderHook(() => useDeleteAccount())
    await act(async () => {
      await result.current.deleteAccount('correct-password')
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockSignOut).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call any auth methods when no session', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockSignIn = jest.mocked(supabase.auth.signInWithPassword)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: null }, error: null } as any)

    const { result } = renderHook(() => useDeleteAccount())
    await act(async () => {
      await result.current.deleteAccount('any-password')
    })

    expect(mockSignIn).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })
})
