import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import SignUpScreen from './sign-up'

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signUp: jest.fn() } },
}))

describe('SignUpScreen', () => {
  const mockSignUp = jest.mocked(supabase.auth.signUp)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('shows error for invalid email format', () => {
    const { getByTestId } = render(<SignUpScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'bademail')
    fireEvent.changeText(getByTestId('password-input'), 'password123')
    fireEvent.press(getByTestId('register-button'))
    expect(mockSignUp).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Invalid email', expect.any(String))
  })

  it('shows error for password shorter than 8 characters', () => {
    const { getByTestId } = render(<SignUpScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com')
    fireEvent.changeText(getByTestId('password-input'), 'short')
    fireEvent.press(getByTestId('register-button'))
    expect(mockSignUp).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Weak password', expect.any(String))
  })

  it('calls supabase.auth.signUp with valid credentials', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: null } as any)
    const { getByTestId } = render(<SignUpScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'newuser@example.com')
    fireEvent.changeText(getByTestId('password-input'), 'securepassword')
    fireEvent.press(getByTestId('register-button'))
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'securepassword',
      })
    })
  })

  it('shows error message on registration failure', async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: 'User already registered' } } as any)
    const { getByTestId } = render(<SignUpScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'existing@example.com')
    fireEvent.changeText(getByTestId('password-input'), 'password123')
    fireEvent.press(getByTestId('register-button'))
    await waitFor(() => {
      // P-01: error message is now generic — never forwards raw Supabase error.message
      expect(Alert.alert).toHaveBeenCalledWith('Registration failed', 'Registration failed. Please try again.')
    })
  })
})
