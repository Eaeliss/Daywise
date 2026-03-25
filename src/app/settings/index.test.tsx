import { fireEvent, render } from '@testing-library/react-native'
import SettingsScreen from './index'

const mockSignOut = jest.fn()
jest.mock('@/hooks/use-session-management', () => ({
  useSignOut: () => ({ signOut: mockSignOut, loading: false }),
}))
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }))

import { router } from 'expo-router'

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders all navigation links and sign-out button', () => {
    const { getByTestId } = render(<SettingsScreen />)
    expect(getByTestId('passkey-settings-link')).toBeTruthy()
    expect(getByTestId('active-sessions-link')).toBeTruthy()
    expect(getByTestId('delete-account-link')).toBeTruthy()
    expect(getByTestId('sign-out-button')).toBeTruthy()
  })

  it('pressing sign-out button calls signOut', () => {
    const { getByTestId } = render(<SettingsScreen />)
    fireEvent.press(getByTestId('sign-out-button'))
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('pressing active-sessions-link navigates to /settings/sessions', () => {
    const { getByTestId } = render(<SettingsScreen />)
    fireEvent.press(getByTestId('active-sessions-link'))
    expect(jest.mocked(router.push)).toHaveBeenCalledWith('/settings/sessions')
  })

  it('pressing delete-account-link navigates to /settings/delete-account', () => {
    const { getByTestId } = render(<SettingsScreen />)
    fireEvent.press(getByTestId('delete-account-link'))
    expect(jest.mocked(router.push)).toHaveBeenCalledWith('/settings/delete-account')
  })

  it('pressing passkey-settings-link navigates to /settings/passkey', () => {
    const { getByTestId } = render(<SettingsScreen />)
    fireEvent.press(getByTestId('passkey-settings-link'))
    expect(jest.mocked(router.push)).toHaveBeenCalledWith('/settings/passkey')
  })
})
