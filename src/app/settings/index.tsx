import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '@/hooks/use-theme'
import { useSignOut } from '@/hooks/use-session-management'
import { useAuthStore } from '@/stores/auth-store'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { usePreferencesStore } from '@/stores/preferences-store'

const APP_VERSION = '1.0.0'
const CURRENCIES = ['USD', 'EUR', 'ILS', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'MXN']

type RowProps = {
  label: string
  value?: string
  onPress?: () => void
  danger?: boolean
  theme: ReturnType<typeof import('@/hooks/use-theme').useTheme>
  isLast?: boolean
  testID?: string
}

function SettingsRow({ label, value, onPress, danger, theme, isLast, testID }: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      style={{
        paddingHorizontal: 16, paddingVertical: 14,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.backgroundSelected,
      }}
    >
      <Text style={{ fontSize: 15, color: danger ? '#ef4444' : theme.text }}>{label}</Text>
      {value !== undefined && (
        <Text style={{ fontSize: 14, color: theme.textSecondary }}>{value}</Text>
      )}
      {onPress && value === undefined && !danger && (
        <Text style={{ fontSize: 18, color: theme.textSecondary }}>›</Text>
      )}
    </Pressable>
  )
}

export default function SettingsScreen() {
  const theme = useTheme()
  const { signOut, loading } = useSignOut()
  const user = useAuthStore((s) => s.user)
  const { displayName, setDisplayName } = useOnboardingStore()
  const { currency, setCurrency } = usePreferencesStore()

  const [editNameVisible, setEditNameVisible] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false)

  const email = user?.email ?? ''
  const initials = displayName
    ? displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() ?? '?'

  function openEditName() {
    setDraftName(displayName)
    setEditNameVisible(true)
  }

  function handleSaveName() {
    if (draftName.trim()) setDisplayName(draftName.trim())
    setEditNameVisible(false)
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* Profile card */}
      <View style={{
        margin: 20,
        backgroundColor: theme.backgroundElement,
        borderRadius: 16, padding: 20,
        alignItems: 'center',
      }}>
        <View style={{
          width: 64, height: 64, borderRadius: 32,
          backgroundColor: '#3b82f6',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 12,
        }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>{initials}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
          {displayName || 'Your Name'}
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>{email}</Text>
        <Pressable
          onPress={openEditName}
          style={{
            paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10,
            backgroundColor: theme.backgroundSelected,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#3b82f6' }}>Edit Name</Text>
        </Pressable>
      </View>

      {/* Currency */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, paddingHorizontal: 20, marginBottom: 8, letterSpacing: 0.5 }}>
        PREFERENCES
      </Text>
      <View style={{ marginHorizontal: 20, backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <SettingsRow label="Currency" value={currency} onPress={() => setCurrencyModalVisible(true)} theme={theme} isLast />
      </View>

      {/* Account section */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, paddingHorizontal: 20, marginBottom: 8, letterSpacing: 0.5 }}>
        ACCOUNT
      </Text>
      <View style={{ marginHorizontal: 20, backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <SettingsRow label="Preferences" onPress={() => router.push('/settings/preferences')} theme={theme} testID="preferences-settings-link" />
        <SettingsRow label="Passkey" onPress={() => router.push('/settings/passkey')} theme={theme} testID="passkey-settings-link" />
        <SettingsRow label="Active Sessions" onPress={() => router.push('/settings/sessions')} theme={theme} testID="active-sessions-link" isLast />
      </View>

      {/* Danger zone */}
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, paddingHorizontal: 20, marginBottom: 8, letterSpacing: 0.5 }}>
        DANGER ZONE
      </Text>
      <View style={{ marginHorizontal: 20, backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <SettingsRow label="Delete Account" onPress={() => router.push('/settings/delete-account')} danger theme={theme} testID="delete-account-link" isLast />
      </View>

      {/* Sign out */}
      <View style={{ marginHorizontal: 20, backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <Pressable
          onPress={signOut}
          disabled={loading}
          style={{ paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center' }}
          testID="sign-out-button"
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444', opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Signing out…' : 'Sign Out'}
          </Text>
        </Pressable>
      </View>

      {/* App info */}
      <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
        Daywise v{APP_VERSION}
      </Text>

      {/* Currency modal */}
      <Modal visible={currencyModalVisible} transparent animationType="fade" onRequestClose={() => setCurrencyModalVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setCurrencyModalVisible(false)}>
          <View onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()} style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Currency</Text>
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
              {CURRENCIES.map((c, i) => (
                <Pressable
                  key={c}
                  onPress={() => { setCurrency(c); setCurrencyModalVisible(false) }}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 14,
                    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    borderBottomWidth: i < CURRENCIES.length - 1 ? 1 : 0,
                    borderBottomColor: theme.backgroundSelected,
                  }}
                >
                  <Text style={{ fontSize: 15, color: theme.text }}>{c}</Text>
                  {currency === c && <Text style={{ color: '#3b82f6', fontSize: 16 }}>✓</Text>}
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Edit name modal */}
      <Modal
        visible={editNameVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditNameVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setEditNameVisible(false)}
        >
          <View
            onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
            style={{
              backgroundColor: theme.background,
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              padding: 24,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>
              Edit Name
            </Text>
            <TextInput
              autoFocus
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
              style={{
                backgroundColor: theme.backgroundElement,
                borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                fontSize: 15, color: theme.text, marginBottom: 16,
              }}
            />
            <Pressable
              onPress={handleSaveName}
              style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  )
}
