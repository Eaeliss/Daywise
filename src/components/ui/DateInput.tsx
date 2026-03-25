import { useRef } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'

type Props = {
  value: string // YYYY-MM-DD or ''
  onChange: (value: string) => void
  placeholder?: string
}

// Splits a YYYY-MM-DD string into parts; returns empty strings for missing
function parse(value: string) {
  const [y = '', m = '', d = ''] = value.split('-')
  return { y, m, d }
}

function build(y: string, m: string, d: string): string {
  if (!y && !m && !d) return ''
  const yy = y.padStart(4, '0')
  const mm = m.padStart(2, '0')
  const dd = d.padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function isValid(y: string, m: string, d: string): boolean {
  if (y.length !== 4 || m.length < 1 || d.length < 1) return false
  const mn = parseInt(m, 10)
  const dn = parseInt(d, 10)
  const yn = parseInt(y, 10)
  if (mn < 1 || mn > 12 || dn < 1 || dn > 31 || yn < 2000 || yn > 2100) return false
  // Verify the date actually exists (catches Feb 30, Apr 31, etc.)
  const date = new Date(yn, mn - 1, dn)
  return date.getFullYear() === yn && date.getMonth() === mn - 1 && date.getDate() === dn
}

export function DateInput({ value, onChange, placeholder = 'Date (optional)' }: Props) {
  const theme = useTheme()
  const { y, m, d } = parse(value)
  const monthRef = useRef<TextInput>(null)
  const dayRef = useRef<TextInput>(null)
  const yearRef = useRef<TextInput>(null)

  const valid = value === '' || isValid(y, m, d)

  function handleMonth(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2)
    onChange(build(y, clean, d))
    if (clean.length === 2) dayRef.current?.focus()
  }

  function handleDay(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2)
    onChange(build(y, m, clean))
    if (clean.length === 2) yearRef.current?.focus()
  }

  function handleYear(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 4)
    onChange(build(clean, m, d))
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10,
    fontSize: 15, color: theme.text, textAlign: 'center' as const,
  }

  const borderColor = !valid ? '#ef4444' : 'transparent'

  return (
    <View>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 6,
        borderWidth: 1.5, borderColor,
      }}>
        <TextInput
          ref={monthRef}
          value={m}
          onChangeText={handleMonth}
          placeholder="MM"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={2}
          style={{ ...inputStyle, width: 44 }}
        />
        <Text style={{ color: theme.textSecondary, fontSize: 16 }}>/</Text>
        <TextInput
          ref={dayRef}
          value={d}
          onChangeText={handleDay}
          placeholder="DD"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={2}
          style={{ ...inputStyle, width: 44 }}
        />
        <Text style={{ color: theme.textSecondary, fontSize: 16 }}>/</Text>
        <TextInput
          ref={yearRef}
          value={y}
          onChangeText={handleYear}
          placeholder="YYYY"
          placeholderTextColor={theme.textSecondary}
          keyboardType="number-pad"
          maxLength={4}
          style={{ ...inputStyle, flex: 1 }}
        />
      </View>
      {!valid && (
        <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 4, paddingHorizontal: 2 }}>
          Invalid date
        </Text>
      )}
    </View>
  )
}
