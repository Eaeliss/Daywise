import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { supabase } from '@/lib/supabase'
import SignInScreen from './sign-in'

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }))
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn() } },
}))
const mockSignInWithGoogle = jest.fn()
jest.mock('@/hooks/use-google-sign-in', () => ({
  useGoogleSignIn: () => ({ signInWithGoogle: mockSignInWithGoogle, loading: false }),
}))
const mockPasskeySignIn = jest.fn()
jest.mock('@/hooks/use-passkey', () => ({
  usePasskeySignIn: () => ({ signIn: mockPasskeySignIn, loading: false }),
}))

describe('SignInScreen', () => {
  const mockSignIn = jest.mocked(supabase.auth.signInWithPassword)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  it('shows validation error for invalid email', () => {
    const { getByTestId } = render(<SignInScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'not-an-email')
    fireEvent.press(getByTestId('sign-in-button'))
    expect(mockSignIn).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Invalid input', expect.any(String))
  })

  it('shows validation error for empty password', () => {
    const { getByTestId } = render(<SignInScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com')
    fireEvent.press(getByTestId('sign-in-button'))
    expect(mockSignIn).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalledWith('Invalid input', expect.any(String))
  })

  it('shows generic error message on auth failure (AC3)', async () => {
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } } as any)
    const { getByTestId } = render(<SignInScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com')
    fireEvent.changeText(getByTestId('password-input'), 'password123')
    fireEvent.press(getByTestId('sign-in-button'))
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Sign in failed', 'Email or password is incorrect.')
    })
  })

  it('calls supabase.auth.signInWithPassword with correct credentials', async () => {
    mockSignIn.mockResolvedValue({ error: null } as any)
    const { getByTestId } = render(<SignInScreen />)
    fireEvent.changeText(getByTestId('email-input'), 'user@example.com')
    fireEvent.changeText(getByTestId('password-input'), 'mypassword')
    fireEvent.press(getByTestId('sign-in-button'))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({ email: 'user@example.com', password: 'mypassword' })
    })
  })

  it('renders Google sign-in button', () => {
    const { getByTestId } = render(<SignInScreen />)
    expect(getByTestId('google-sign-in-button')).toBeTruthy()
  })

  it('pressing Google sign-in button calls signInWithGoogle', () => {
    const { getByTestId } = render(<SignInScreen />)
    fireEvent.press(getByTestId('google-sign-in-button'))
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it('renders passkey sign-in button', () => {
    const { getByTestId } = render(<SignInScreen />)
    expect(getByTestId('passkey-sign-in-button')).toBeTruthy()
  })

  it('pressing passkey sign-in button calls signIn', () => {
    const { getByTestId } = render(<SignInScreen />)
    fireEvent.press(getByTestId('passkey-sign-in-button'))
    expect(mockPasskeySignIn).toHaveBeenCalledTimes(1)
  })
})
