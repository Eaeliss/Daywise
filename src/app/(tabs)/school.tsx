import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useTheme } from '@/hooks/use-theme'
import { useSchoolStore, Assignment, Course } from '@/stores/school-store'
import { useT } from '@/utils/i18n'

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDueDate(iso: string | null): string {
  if (!iso) return 'No due date'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'No due date'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false
  return new Date(dueAt) < new Date()
}

function courseProgress(course: Course): number {
  if (course.assignments.length === 0) return 0
  return course.assignments.filter((a) => a.completed).length / course.assignments.length
}

export default function SchoolScreen() {
  const theme = useTheme()
  const tr = useT()
  const { courses, loading, lastSynced, canvasUrl, canvasToken, setCredentials, clearCredentials, syncFromCanvas, toggleAssignment, hasCredentials } = useSchoolStore()

  const [setupVisible, setSetupVisible] = useState(false)
  const [urlInput, setUrlInput] = useState(canvasUrl)
  const [tokenInput, setTokenInput] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null)

  const today = getTodayString()

  async function handleSync() {
    setSyncing(true)
    try {
      await syncFromCanvas()
    } catch (e: any) {
      Alert.alert('Sync failed', e?.message ?? 'Could not connect to Canvas. Check your URL and token.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleSaveCredentials() {
    const url = urlInput.trim().replace(/\/$/, '')
    const token = tokenInput.trim()
    if (!url || !token) {
      Alert.alert('Missing fields', 'Please enter both your Canvas URL and API token.')
      return
    }
    setCredentials(url, token)
    setSetupVisible(false)
    setTokenInput('')
    // Auto-sync after connecting
    setSyncing(true)
    try {
      await syncFromCanvas()
    } catch (e: any) {
      Alert.alert('Sync failed', e?.message ?? 'Could not connect to Canvas. Check your URL and token.')
    } finally {
      setSyncing(false)
    }
  }

  function handleDisconnect() {
    Alert.alert('Disconnect Canvas', 'This will remove your Canvas credentials and course data from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => clearCredentials() },
    ])
  }

  // Upcoming assignments across all courses (next 14 days, not completed)
  const upcomingAssignments = useMemo(() => {
    const result: (Assignment & { courseName: string })[] = []
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() + 14)
    for (const course of courses) {
      for (const a of course.assignments) {
        if (a.completed) continue
        if (a.dueAt && new Date(a.dueAt) <= cutoff) {
          result.push({ ...a, courseName: course.name })
        }
      }
    }
    result.sort((a, b) => {
      if (!a.dueAt) return 1
      if (!b.dueAt) return -1
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    })
    return result
  }, [courses])

  if (!hasCredentials()) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🎓</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text, textAlign: 'center', marginBottom: 8 }}>
          {tr('school')}
        </Text>
        <Text style={{ fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 32 }}>
          Connect your Canvas account to track courses, assignments, and progress automatically.
        </Text>
        <Pressable
          onPress={() => setSetupVisible(true)}
          style={{ backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 }}
        >
          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{tr('connectCanvas')}</Text>
        </Pressable>

        <Modal visible={setupVisible} transparent animationType="fade" onRequestClose={() => setSetupVisible(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setSetupVisible(false)}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View
                onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
                style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}
              >
                <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 8 }}>
                  Connect Canvas
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
                  Enter your institution's Canvas URL and a personal API token. Generate one in Canvas → Account → Settings → New Access Token.
                </Text>
                <TextInput
                  value={urlInput}
                  onChangeText={setUrlInput}
                  placeholder="https://university.instructure.com"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={{
                    backgroundColor: theme.backgroundElement, borderRadius: 10,
                    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
                    color: theme.text, marginBottom: 10,
                  }}
                />
                <TextInput
                  value={tokenInput}
                  onChangeText={setTokenInput}
                  placeholder="Canvas API token"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  secureTextEntry
                  style={{
                    backgroundColor: theme.backgroundElement, borderRadius: 10,
                    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
                    color: theme.text, marginBottom: 20,
                  }}
                />
                <Pressable
                  onPress={handleSaveCredentials}
                  style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Connect & Sync</Text>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          </Pressable>
        </Modal>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>

        {/* Header actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
              {tr('school')}
            </Text>
            {lastSynced && (
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                Synced {new Date(lastSynced).toLocaleString()}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={handleSync}
              disabled={syncing || loading}
              style={{
                backgroundColor: '#3b82f6', borderRadius: 8,
                paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
            >
              {(syncing || loading) ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>↻ Sync</Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleDisconnect}
              style={{ backgroundColor: theme.backgroundElement, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
            >
              <Text style={{ color: '#ef4444', fontWeight: '500', fontSize: 14 }}>Disconnect</Text>
            </Pressable>
          </View>
        </View>

        {/* Upcoming assignments (next 14 days) */}
        {upcomingAssignments.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
              Due Soon
            </Text>
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
              {upcomingAssignments.map((a, i) => {
                const overdue = isOverdue(a.dueAt)
                return (
                  <Pressable
                    key={`${a.courseId}-${a.id}`}
                    onPress={() => toggleAssignment(a.courseId, a.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 16, paddingVertical: 13,
                      borderBottomWidth: i < upcomingAssignments.length - 1 ? 1 : 0,
                      borderBottomColor: theme.backgroundSelected,
                    }}
                  >
                    {/* Checkbox */}
                    <View style={{
                      width: 22, height: 22, borderRadius: 6,
                      borderWidth: 2, borderColor: a.completed ? '#22c55e' : theme.textSecondary,
                      backgroundColor: a.completed ? '#22c55e' : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {a.completed && <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={{
                        fontSize: 14, color: a.completed ? theme.textSecondary : theme.text,
                        textDecorationLine: a.completed ? 'line-through' : 'none',
                      }}>
                        {a.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: overdue ? '#ef4444' : theme.textSecondary, marginTop: 2 }}>
                        {a.courseName} · {formatDueDate(a.dueAt)}{overdue ? ' (overdue)' : ''}
                      </Text>
                    </View>
                    {a.submittedOnCanvas && (
                      <View style={{ backgroundColor: '#22c55e22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '600' }}>Submitted</Text>
                      </View>
                    )}
                  </Pressable>
                )
              })}
            </View>
          </View>
        )}

        {/* Courses */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
          {tr('courses')}
        </Text>

        {courses.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 32 }}>
            <Text style={{ fontSize: 15, color: theme.textSecondary }}>{tr('noCoursesYet')}</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6 }}>
              Tap Sync to load your Canvas courses.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {courses.map((course) => {
              const pct = courseProgress(course)
              const total = course.assignments.length
              const done = course.assignments.filter((a) => a.completed).length
              const isExpanded = expandedCourse === course.id
              const pending = course.assignments.filter((a) => !a.completed)
              const completedList = course.assignments.filter((a) => a.completed)

              return (
                <View key={course.id} style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
                  {/* Course header */}
                  <Pressable
                    onPress={() => setExpandedCourse(isExpanded ? null : course.id)}
                    style={{ padding: 16 }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                          {course.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                          {course.courseCode} · {done}/{total} {tr('assignments')}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: pct === 1 ? '#22c55e' : '#3b82f6' }}>
                          {Math.round(pct * 100)}%
                        </Text>
                        <Text style={{ color: theme.textSecondary, fontSize: 16 }}>
                          {isExpanded ? '▲' : '▼'}
                        </Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={{ height: 6, backgroundColor: theme.backgroundSelected, borderRadius: 3 }}>
                      <View style={{
                        height: 6, borderRadius: 3,
                        backgroundColor: pct === 1 ? '#22c55e' : '#3b82f6',
                        width: `${Math.round(pct * 100)}%`,
                      }} />
                    </View>
                  </Pressable>

                  {/* Assignments list (expanded) */}
                  {isExpanded && (
                    <View style={{ borderTopWidth: 1, borderTopColor: theme.backgroundSelected }}>
                      {total === 0 ? (
                        <Text style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center', padding: 16 }}>
                          No assignments
                        </Text>
                      ) : (
                        [...pending, ...completedList].map((a, i) => {
                          const overdue = !a.completed && isOverdue(a.dueAt)
                          return (
                            <Pressable
                              key={a.id}
                              onPress={() => toggleAssignment(course.id, a.id)}
                              style={{
                                flexDirection: 'row', alignItems: 'center', gap: 12,
                                paddingHorizontal: 16, paddingVertical: 12,
                                borderBottomWidth: i < total - 1 ? 1 : 0,
                                borderBottomColor: theme.backgroundSelected,
                                backgroundColor: a.completed ? theme.backgroundSelected + '44' : 'transparent',
                              }}
                            >
                              {/* Checkbox */}
                              <View style={{
                                width: 20, height: 20, borderRadius: 5,
                                borderWidth: 2, borderColor: a.completed ? '#22c55e' : theme.textSecondary,
                                backgroundColor: a.completed ? '#22c55e' : 'transparent',
                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                {a.completed && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text numberOfLines={2} style={{
                                  fontSize: 14, color: a.completed ? theme.textSecondary : theme.text,
                                  textDecorationLine: a.completed ? 'line-through' : 'none',
                                }}>
                                  {a.name}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                  <Text style={{ fontSize: 12, color: overdue ? '#ef4444' : theme.textSecondary }}>
                                    {formatDueDate(a.dueAt)}{overdue ? ' ⚠️' : ''}
                                  </Text>
                                  {a.pointsPossible != null && (
                                    <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                                      · {a.pointsPossible} pts
                                    </Text>
                                  )}
                                </View>
                              </View>
                              {a.submittedOnCanvas && !a.completed && (
                                <View style={{ backgroundColor: '#22c55e22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                                  <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '600' }}>✓ Canvas</Text>
                                </View>
                              )}
                              {a.grade && (
                                <View style={{ backgroundColor: '#3b82f622', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                                  <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '600' }}>{a.grade}</Text>
                                </View>
                              )}
                            </Pressable>
                          )
                        })
                      )}
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
