import { renderHook, waitFor } from '@testing-library/react-native'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/hooks/use-auth'

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
  },
}))

describe('useAuth', () => {
  const mockOnAuthStateChange = jest.mocked(supabase.auth.onAuthStateChange)
  const mockUnsubscribe = jest.fn()
  let capturedCallback: ((event: string, session: any) => void) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    capturedCallback = null
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      capturedCallback = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } } as any
    })
    useAuthStore.setState({ session: null, user: null, initialized: false, isPasswordRecovery: false })
  })

  it('subscribes to onAuthStateChange on mount', async () => {
    renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    expect(mockOnAuthStateChange).toHaveBeenCalled()
  })

  it('sets session and initialized on INITIAL_SESSION event', async () => {
    renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    const mockSession = { user: { id: 'abc', email: 'a@b.com' } } as any
    capturedCallback!('INITIAL_SESSION', mockSession)
    expect(useAuthStore.getState().session).toBe(mockSession)
    expect(useAuthStore.getState().initialized).toBe(true)
  })

  it('sets initialized to true with null session on INITIAL_SESSION with no stored session', async () => {
    renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    capturedCallback!('INITIAL_SESSION', null)
    expect(useAuthStore.getState().session).toBeNull()
    expect(useAuthStore.getState().initialized).toBe(true)
  })

  it('updates session on SIGNED_IN without changing initialized', async () => {
    renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    const newSession = { user: { id: 'xyz', email: 'x@y.com' } } as any
    capturedCallback!('SIGNED_IN', newSession)
    expect(useAuthStore.getState().session).toBe(newSession)
    expect(useAuthStore.getState().initialized).toBe(false) // only INITIAL_SESSION sets this
  })

  it('unsubscribes from onAuthStateChange on unmount', async () => {
    const { unmount } = renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })

  it('sets isPasswordRecovery to true on PASSWORD_RECOVERY event', async () => {
    renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    const recoverySession = { user: { id: 'abc' } } as any
    capturedCallback!('PASSWORD_RECOVERY', recoverySession)
    expect(useAuthStore.getState().isPasswordRecovery).toBe(true)
    expect(useAuthStore.getState().session).toBe(recoverySession)
  })

  it('clears isPasswordRecovery on USER_UPDATED event', async () => {
    useAuthStore.setState({ isPasswordRecovery: true })
    renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    const updatedSession = { user: { id: 'abc' } } as any
    capturedCallback!('USER_UPDATED', updatedSession)
    expect(useAuthStore.getState().isPasswordRecovery).toBe(false)
  })

  it('clears isPasswordRecovery on SIGNED_OUT event', async () => {
    useAuthStore.setState({ isPasswordRecovery: true })
    renderHook(() => useAuth())
    await waitFor(() => expect(capturedCallback).not.toBeNull())
    capturedCallback!('SIGNED_OUT', null)
    expect(useAuthStore.getState().isPasswordRecovery).toBe(false)
  })
})
