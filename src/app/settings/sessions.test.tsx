import { fireEvent, render } from '@testing-library/react-native'
import SessionsScreen from './sessions'

const mockRefetch = jest.fn()
const mockSignOutOthers = jest.fn()
const mockRevokeSession = jest.fn().mockResolvedValue(undefined)

jest.mock('@/hooks/use-session-management', () => ({
  useSessionList: () => ({
    sessions: [
      {
        id: 'session-1',
        user_agent: 'Mozilla/5.0 iPhone',
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-17T00:00:00Z',
      },
    ],
    loading: false,
    refetch: mockRefetch,
  }),
  useSignOutOtherSessions: () => ({ signOutOthers: mockSignOutOthers, loading: false }),
  useRevokeSession: () => ({ revokeSession: mockRevokeSession, loading: false }),
}))

describe('SessionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRevokeSession.mockResolvedValue(undefined)
    mockSignOutOthers.mockResolvedValue(undefined)
  })

  it('renders session row and sign-out buttons', () => {
    const { getByTestId, getByText } = render(<SessionsScreen />)
    expect(getByTestId('sign-out-session-0')).toBeTruthy()
    expect(getByTestId('sign-out-others-button')).toBeTruthy()
    expect(getByText('Mozilla/5.0 iPhone')).toBeTruthy()
  })

  it('calls refetch on mount', () => {
    render(<SessionsScreen />)
    expect(mockRefetch).toHaveBeenCalledTimes(1)
  })

  it('pressing per-session sign-out calls revokeSession then refetch', async () => {
    const { getByTestId } = render(<SessionsScreen />)
    fireEvent.press(getByTestId('sign-out-session-0'))
    expect(mockRevokeSession).toHaveBeenCalledWith('session-1')
  })

  it('pressing sign-out-others-button calls signOutOthers', async () => {
    const { getByTestId } = render(<SessionsScreen />)
    fireEvent.press(getByTestId('sign-out-others-button'))
    expect(mockSignOutOthers).toHaveBeenCalledTimes(1)
  })

  it('renders heading and sign-out-others button', () => {
    const { getByText } = render(<SessionsScreen />)
    expect(getByText('Active sessions')).toBeTruthy()
    expect(getByText('Sign out all other devices')).toBeTruthy()
  })
})
