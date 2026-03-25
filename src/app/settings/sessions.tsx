import { useEffect } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'
import {
  useSessionList,
  useSignOutOtherSessions,
  useRevokeSession,
} from '@/hooks/use-session-management'

export default function SessionsScreen() {
  const theme = useTheme()
  const { sessions, loading, refetch } = useSessionList()
  const { signOutOthers, loading: othersLoading } = useSignOutOtherSessions()
  const { revokeSession, loading: revokeLoading } = useRevokeSession()

  useEffect(() => {
    refetch()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 20 }}>
        Active sessions
      </Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{
            paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: theme.backgroundElement,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: theme.text }}>
                {item.user_agent ?? 'Unknown device'}
              </Text>
              <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
                Last active: {new Date(item.updated_at).toLocaleDateString()}
              </Text>
            </View>
            <Pressable
              onPress={() => revokeSession(item.id).then(refetch)}
              disabled={revokeLoading}
              style={{ borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, opacity: revokeLoading ? 0.6 : 1 }}
              testID={`sign-out-session-${index}`}
            >
              {revokeLoading
                ? <ActivityIndicator color="#3b82f6" />
                : <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 13 }}>Sign out</Text>
              }
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          loading
            ? <ActivityIndicator color={theme.textSecondary} style={{ marginTop: 32 }} />
            : <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 32 }}>No active sessions found.</Text>
        }
        style={{ flex: 1 }}
      />
      <Pressable
        onPress={() => signOutOthers().then(refetch)}
        disabled={othersLoading}
        style={{ borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 16, opacity: othersLoading ? 0.6 : 1 }}
        testID="sign-out-others-button"
      >
        {othersLoading
          ? <ActivityIndicator color="#3b82f6" />
          : <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>Sign out all other devices</Text>
        }
      </Pressable>
    </View>
  )
}
