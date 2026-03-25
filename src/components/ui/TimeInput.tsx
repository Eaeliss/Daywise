import { useRef } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'

type Props = {
  value: string // HH:MM or ''
  onChange: (value: string) => void
}

function parse(value: string) {
  const [h = '', m = ''] = value.split(':')
  return { h, m }
}

function build(h: string, m: string): string {
  if (!h && !m) return ''
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
}

export function TimeInput({ value, onChange }: Props) {
  const theme = useTheme()
  const { h, m } = parse(value)
  const minRef = useRef<TextInput>(null)

  const hNum = parseInt(h, 10)
  const mNum = parseInt(m, 10)
  const valid = value === '' || (h.length > 0 && m.length > 0 && hNum >= 0 && hNum < 24 && mNum >= 0 && mNum < 60)

  function handleHour(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2)
    onChange(build(clean, m))
    if (clean.length === 2) minRef.current?.focus()
  }

  function handleMin(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2)
    onChange(build(h, clean))
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10,
    fontSize: 15, color: theme.text, textAlign: 'center' as const, width: 52,
  }

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 6,
      borderWidth: 1.5, borderColor: !valid ? '#ef4444' : 'transparent',
    }}>
      <TextInput
        value={h}
        onChangeText={handleHour}
        placeholder="HH"
        placeholderTextColor={theme.textSecondary}
        keyboardType="number-pad"
        maxLength={2}
        style={inputStyle}
      />
      <Text style={{ color: theme.textSecondary, fontSize: 18, fontWeight: '600' }}>:</Text>
      <TextInput
        ref={minRef}
        value={m}
        onChangeText={handleMin}
        placeholder="MM"
        placeholderTextColor={theme.textSecondary}
        keyboardType="number-pad"
        maxLength={2}
        style={inputStyle}
      />
      <Text style={{ color: theme.textSecondary, fontSize: 13, marginLeft: 4 }}>
        (optional)
      </Text>
    </View>
  )
}
