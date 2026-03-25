import { useAuthStore } from '@/stores/auth-store'

describe('auth-store', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, user: null, initialized: false, isPasswordRecovery: false })
  })

  it('starts with no session and uninitialized state', () => {
    const { session, user, initialized } = useAuthStore.getState()
    expect(session).toBeNull()
    expect(user).toBeNull()
    expect(initialized).toBe(false)
  })

  it('setSession populates user from session.user', () => {
    const mockSession = { user: { id: 'user-123', email: 'test@example.com' } } as any
    useAuthStore.getState().setSession(mockSession)
    expect(useAuthStore.getState().session).toBe(mockSession)
    expect(useAuthStore.getState().user?.id).toBe('user-123')
  })

  it('setSession(null) clears session and user', () => {
    useAuthStore.getState().setSession({ user: { id: 'user-123' } } as any)
    useAuthStore.getState().setSession(null)
    expect(useAuthStore.getState().session).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setInitialized sets the initialized flag', () => {
    useAuthStore.getState().setInitialized(true)
    expect(useAuthStore.getState().initialized).toBe(true)
  })

  it('setPasswordRecovery(true) sets the isPasswordRecovery flag', () => {
    useAuthStore.getState().setPasswordRecovery(true)
    expect(useAuthStore.getState().isPasswordRecovery).toBe(true)
  })

  it('setPasswordRecovery(false) clears the isPasswordRecovery flag', () => {
    useAuthStore.getState().setPasswordRecovery(true)
    useAuthStore.getState().setPasswordRecovery(false)
    expect(useAuthStore.getState().isPasswordRecovery).toBe(false)
  })
})
