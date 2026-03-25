import { renderHook, act } from '@testing-library/react-native'
import {
  useSessionList,
  useSignOut,
  useSignOutOtherSessions,
  useRevokeSession,
} from './use-session-management'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))
jest.mock('expo-router', () => ({ router: { replace: jest.fn(), push: jest.fn() } }))

global.fetch = jest.fn()

import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

const mockSession = {
  user: { id: 'user-123', email: 'test@example.com' },
  access_token: 'access-token-abc',
}

const mockSessions = [
  {
    id: 'session-1',
    user_agent: 'Mozilla/5.0 iPhone',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-17T00:00:00Z',
  },
  {
    id: 'session-2',
    user_agent: 'Mozilla/5.0 Android',
    created_at: '2026-03-10T00:00:00Z',
    updated_at: '2026-03-16T00:00:00Z',
  },
]

describe('useSessionList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls list-sessions Edge Function with auth token and updates sessions state', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSessions),
    } as any)

    const { result } = renderHook(() => useSessionList())
    await act(async () => {
      await result.current.refetch()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('list-sessions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${mockSession.access_token}`,
        }),
      }),
    )
    expect(result.current.sessions).toEqual(mockSessions)
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call Edge Function when no session', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: null }, error: null } as any)

    const { result } = renderHook(() => useSessionList())
    await act(async () => {
      await result.current.refetch()
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('resets loading on Edge Function error', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as any)

    const { result } = renderHook(() => useSessionList())
    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.sessions).toEqual([])
  })
})

describe('useSignOut', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls supabase.auth.signOut()', async () => {
    const mockSignOut = jest.mocked(supabase.auth.signOut)
    mockSignOut.mockResolvedValue({ error: null } as any)

    const { result } = renderHook(() => useSignOut())
    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSignOut).toHaveBeenCalledTimes(1)
    expect(mockSignOut).toHaveBeenCalledWith()
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call router.replace — routing delegated to _layout.tsx', async () => {
    const mockSignOut = jest.mocked(supabase.auth.signOut)
    mockSignOut.mockResolvedValue({ error: null } as any)

    const { result } = renderHook(() => useSignOut())
    await act(async () => {
      await result.current.signOut()
    })

    expect(jest.mocked(router.replace)).not.toHaveBeenCalled()
  })
})

describe('useSignOutOtherSessions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls supabase.auth.signOut with scope: others', async () => {
    const mockSignOut = jest.mocked(supabase.auth.signOut)
    mockSignOut.mockResolvedValue({ error: null } as any)

    const { result } = renderHook(() => useSignOutOtherSessions())
    await act(async () => {
      await result.current.signOutOthers()
    })

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'others' })
    expect(result.current.loading).toBe(false)
  })
})

describe('useRevokeSession', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls list-sessions Edge Function with action: revoke and sessionId', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: mockSession }, error: null } as any)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as any)

    const { result } = renderHook(() => useRevokeSession())
    await act(async () => {
      await result.current.revokeSession('session-1')
    })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('list-sessions'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'revoke', sessionId: 'session-1' }),
      }),
    )
    expect(result.current.loading).toBe(false)
  })

  it('does NOT call Edge Function when no session', async () => {
    const mockGetSession = jest.mocked(supabase.auth.getSession)
    const mockFetch = jest.mocked(global.fetch)

    mockGetSession.mockResolvedValue({ data: { session: null }, error: null } as any)

    const { result } = renderHook(() => useRevokeSession())
    await act(async () => {
      await result.current.revokeSession('session-1')
    })

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })
})
