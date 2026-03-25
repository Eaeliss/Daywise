import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import ResetPasswordScreen from './reset-password'

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { updateUser: jest.fn() } },
}))

describe('ResetPasswordScreen', () => {
  const mockUpdateUser = jest.mocked(supabase.auth.updateUser)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('shows error for password shorter than 8 characters', () => {
    const { getByTestId } = render(<ResetPasswordScreen />)
    fireEvent.changeText(getByTestId('password-input'), 'short')
    fireEvent.changeText(getByTestId('confirm-password-input'), 'short')
    fireEvent.press(getByTestId('update-button'))
    expect(mockUpdateUser).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Weak password', expect.any(String))
  })

  it('shows error for whitespace-only password (P-04)', () => {
    const { getByTestId } = render(<ResetPasswordScreen />)
    fireEvent.changeText(getByTestId('password-input'), '        ') // 8 spaces
    fireEvent.changeText(getByTestId('confirm-password-input'), '        ')
    fireEvent.press(getByTestId('update-button'))
    expect(mockUpdateUser).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Weak password', expect.any(String))
  })

  it('shows error when passwords do not match', () => {
    const { getByTestId } = render(<ResetPasswordScreen />)
    fireEvent.changeText(getByTestId('password-input'), 'password123')
    fireEvent.changeText(getByTestId('confirm-password-input'), 'different123')
    fireEvent.press(getByTestId('update-button'))
    expect(mockUpdateUser).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Password mismatch', expect.any(String))
  })

  it('calls supabase.auth.updateUser with new password for valid matching input', async () => {
    mockUpdateUser.mockResolvedValue({ data: { user: null }, error: null } as any)
    const { getByTestId } = render(<ResetPasswordScreen />)
    fireEvent.changeText(getByTestId('password-input'), 'newpassword')
    fireEvent.changeText(getByTestId('confirm-password-input'), 'newpassword')
    fireEvent.press(getByTestId('update-button'))
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword' })
    })
  })

  it('shows generic error message when updateUser fails', async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    } as any)
    const { getByTestId } = render(<ResetPasswordScreen />)
    fireEvent.changeText(getByTestId('password-input'), 'newpassword')
    fireEvent.changeText(getByTestId('confirm-password-input'), 'newpassword')
    fireEvent.press(getByTestId('update-button'))
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Update failed',
        'Password update failed. Please try again.',
      )
    })
  })

  it('shows generic error message when updateUser throws (P-03)', async () => {
    mockUpdateUser.mockRejectedValue(new Error('Network error'))
    const { getByTestId } = render(<ResetPasswordScreen />)
    fireEvent.changeText(getByTestId('password-input'), 'newpassword')
    fireEvent.changeText(getByTestId('confirm-password-input'), 'newpassword')
    fireEvent.press(getByTestId('update-button'))
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Update failed',
        'Password update failed. Please try again.',
      )
    })
  })
})
