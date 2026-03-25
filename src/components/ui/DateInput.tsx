import { useEffect, useRef, useState } from 'react'
import { Platform, Text, TextInput, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'

type Props = {
  value: string // YYYY-MM-DD or ''
  onChange: (value: string) => void
  placeholder?: string
}

function parseValue(value: string) {
  if (!value) return { y: '', m: '', d: '' }
  const [y = '', m = '', d = ''] = value.split('-')
  return {
    y,
    m: m ? String(parseInt(m, 10)) : '',
    d: d ? String(parseInt(d, 10)) : '',
  }
}

function isValid(y: string, m: string, d: string): boolean {
  if (y.length !== 4 || !m || !d) return false
  const mn = parseInt(m, 10)
  const dn = parseInt(d, 10)
  const yn = parseInt(y, 10)
  if (mn < 1 || mn > 12 || dn < 1 || dn > 31 || yn < 2000 || yn > 2100) return false
  const date = new Date(yn, mn - 1, dn)
  return date.getFullYear() === yn && date.getMonth() === mn - 1 && date.getDate() === dn
}

// Web: native browser date picker
function WebDateInput({ value, onChange, theme }: Props & { theme: ReturnType<typeof useTheme> }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      style={{
        width: '100%',
        backgroundColor: theme.backgroundElement,
        color: theme.text,
        border: 'none',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box',
        colorScheme: theme.background === '#000000' ? 'dark' : 'light',
      } as any}
    />
  )
}

// Native: split MM / DD / YYYY fields
function NativeDateInput({ value, onChange, theme }: Props & { theme: ReturnType<typeof useTheme> }) {
  const init = parseValue(value)
  const [m, setM] = useState(init.m)
  const [d, setD] = useState(init.d)
  const [y, setY] = useState(init.y)
  const prevValue = useRef(value)

  const monthRef = useRef<TextInput>(null)
  const dayRef = useRef<TextInput>(null)
  const yearRef = useRef<TextInput>(null)

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value
      const p = parseValue(value)
      setM(p.m)
      setD(p.d)
      setY(p.y)
    }
  }, [value])

  const valid = (!m && !d && !y) || isValid(y, m, d)

  function emit(newY: string, newM: string, newD: string) {
    if (!newY && !newM && !newD) { onChange(''); return }
    if (newY.length === 4 && newM && newD) {
      const built = `${newY}-${newM.padStart(2, '0')}-${newD.padStart(2, '0')}`
      prevValue.current = built
      onChange(built)
    }
  }

  function handleMonth(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2)
    setM(clean)
    emit(y, clean, d)
    if (clean.length === 2) dayRef.current?.focus()
  }

  function handleDay(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 2)
    setD(clean)
    emit(y, m, clean)
    if (clean.length === 2) yearRef.current?.focus()
  }

  function handleYear(text: string) {
    const clean = text.replace(/\D/g, '').slice(0, 4)
    setY(clean)
    emit(clean, m, d)
  }

  const inputStyle = {
    backgroundColor: theme.backgroundElement,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10,
    fontSize: 15, color: theme.text, textAlign: 'center' as const,
  }

  return (
    <View>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 6,
        borderWidth: 1.5, borderColor: !valid ? '#ef4444' : 'transparent',
      }}>
        <TextInput ref={monthRef} value={m} onChangeText={handleMonth} placeholder="MM"
          placeholderTextColor={theme.textSecondary} keyboardType="number-pad" maxLength={2}
          style={{ ...inputStyle, width: 44 }} />
        <Text style={{ color: theme.textSecondary, fontSize: 16 }}>/</Text>
        <TextInput ref={dayRef} value={d} onChangeText={handleDay} placeholder="DD"
          placeholderTextColor={theme.textSecondary} keyboardType="number-pad" maxLength={2}
          style={{ ...inputStyle, width: 44 }} />
        <Text style={{ color: theme.textSecondary, fontSize: 16 }}>/</Text>
        <TextInput ref={yearRef} value={y} onChangeText={handleYear} placeholder="YYYY"
          placeholderTextColor={theme.textSecondary} keyboardType="number-pad" maxLength={4}
          style={{ ...inputStyle, flex: 1 }} />
      </View>
      {!valid && (
        <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 4, paddingHorizontal: 2 }}>
          Invalid date
        </Text>
      )}
    </View>
  )
}

export function DateInput(props: Props) {
  const theme = useTheme()
  if (Platform.OS === 'web') return <WebDateInput {...props} theme={theme} />
  return <NativeDateInput {...props} theme={theme} />
}
