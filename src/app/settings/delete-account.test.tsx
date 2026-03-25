import { fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'
import DeleteAccountScreen from './delete-account'

const mockDeleteAccount = jest.fn()
jest.mock('@/hooks/use-delete-account', () => ({
  useDeleteAccount: () => ({ deleteAccount: mockDeleteAccount, loading: false }),
}))

describe('DeleteAccountScreen', () => {
  let alertSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockDeleteAccount.mockResolvedValue(undefined)
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })

  afterEach(() => {
    alertSpy.mockRestore()
  })

  it('renders password input and delete button', () => {
    const { getByTestId } = render(<DeleteAccountScreen />)
    expect(getByTestId('confirm-password-input')).toBeTruthy()
    expect(getByTestId('delete-account-button')).toBeTruthy()
  })

  it('renders confirmation text', () => {
    const { getByText } = render(<DeleteAccountScreen />)
    expect(getByText(/This action is permanent/)).toBeTruthy()
  })

  it('pressing delete with empty password does NOT call deleteAccount', () => {
    const { getByTestId } = render(<DeleteAccountScreen />)
    fireEvent.press(getByTestId('delete-account-button'))
    expect(mockDeleteAccount).not.toHaveBeenCalled()
  })

  it('pressing delete with password calls deleteAccount', async () => {
    const { getByTestId } = render(<DeleteAccountScreen />)
    fireEvent.changeText(getByTestId('confirm-password-input'), 'mypassword')
    fireEvent.press(getByTestId('delete-account-button'))
    expect(mockDeleteAccount).toHaveBeenCalledWith('mypassword')
  })

  it('shows generic "Deletion failed" alert when deleteAccount resolves (screen still mounted)', async () => {
    const { getByTestId } = render(<DeleteAccountScreen />)
    fireEvent.changeText(getByTestId('confirm-password-input'), 'mypassword')
    await fireEvent.press(getByTestId('delete-account-button'))
    // deleteAccount resolved (failure path — screen still mounted) → Alert shown
    expect(alertSpy).toHaveBeenCalledWith('Deletion failed', expect.any(String))
  })
})
