import { fireEvent, render } from '@testing-library/react-native'
import PasskeySettingsScreen from './passkey'

const mockRegister = jest.fn()
jest.mock('@/hooks/use-passkey', () => ({
  usePasskeyRegister: () => ({ register: mockRegister, loading: false }),
}))

describe('PasskeySettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders setup passkey button', () => {
    const { getByTestId } = render(<PasskeySettingsScreen />)
    expect(getByTestId('setup-passkey-button')).toBeTruthy()
  })

  it('pressing setup passkey button calls register', () => {
    const { getByTestId } = render(<PasskeySettingsScreen />)
    fireEvent.press(getByTestId('setup-passkey-button'))
    expect(mockRegister).toHaveBeenCalledTimes(1)
  })
})
