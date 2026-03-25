import { ActivityIndicator, Pressable, PressableProps, StyleSheet, Text, ViewStyle } from 'react-native'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children: string
  loading?: boolean
  variant?: 'primary' | 'secondary'
  style?: ViewStyle
}

export function Button({
  children,
  loading,
  disabled,
  variant = 'primary',
  style,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      style={StyleSheet.flatten([
        {
          borderRadius: 10,
          paddingVertical: 14,
          paddingHorizontal: 24,
          alignItems: 'center' as const,
          backgroundColor: isPrimary ? '#3b82f6' : 'transparent',
          borderWidth: isPrimary ? 0 : 1.5,
          borderColor: '#3b82f6',
          opacity: disabled || loading ? 0.5 : 1,
        },
        style,
      ])}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? 'white' : '#3b82f6'} />
      ) : (
        <Text style={{ fontWeight: '600', fontSize: 15, color: isPrimary ? '#fff' : '#3b82f6' }}>
          {children}
        </Text>
      )}
    </Pressable>
  )
}
