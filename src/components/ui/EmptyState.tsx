import { Text, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'

type Props = { emoji: string; title: string; subtitle: string }

export function EmptyState({ emoji, title, subtitle }: Props) {
  const theme = useTheme()
  return (
    <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</Text>
      <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 8, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>
    </View>
  )
}
