import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import ForgotPasswordScreen from './forgot-password'

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: jest.fn() } },
}))

describe('ForgotPasswordScreen', () => {
  const mockResetPasswordForEmail = jest.mocked(supabase.auth.resetPasswordForEmail)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('shows error for invalid email format', () => {
    const { getByTestId } = render(<ForgotPasswordScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'bademail')
    fireEvent.press(getByTestId('send-button'))
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Invalid email', expect.any(String))
  })

  it('calls resetPasswordForEmail with correct args for valid email', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null } as any)
    const { getByTestId } = render(<ForgotPasswordScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com')
    fireEvent.press(getByTestId('send-button'))
    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
        redirectTo: 'lifeplanapp://auth/reset-password',
      })
    })
  })

  it('shows success message when Supabase returns no error (AC3 — valid email)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null } as any)
    const { getByTestId } = render(<ForgotPasswordScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com')
    fireEvent.press(getByTestId('send-button'))
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email sent',
        expect.stringContaining('If an account exists'),
        expect.any(Array),
      )
    })
  })

  it('shows same success message when Supabase returns error (AC3 — non-existent email)', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      data: {},
      error: { message: 'User not found' },
    } as any)
    const { getByTestId } = render(<ForgotPasswordScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'noone@example.com')
    fireEvent.press(getByTestId('send-button'))
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email sent',
        expect.stringContaining('If an account exists'),
        expect.any(Array),
      )
    })
  })

  it('shows same success message when Supabase throws (P-02 — loading reset on throw)', async () => {
    mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'))
    const { getByTestId } = render(<ForgotPasswordScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com')
    fireEvent.press(getByTestId('send-button'))
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Email sent',
        expect.stringContaining('If an account exists'),
        expect.any(Array),
      )
    })
  })
})
