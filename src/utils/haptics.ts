import { Vibration, Platform } from 'react-native'
export function hapticLight() { if (Platform.OS === 'android') Vibration.vibrate(10) }
export function hapticSuccess() { if (Platform.OS === 'android') Vibration.vibrate(30) }
