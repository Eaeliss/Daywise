import { useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { useTheme } from '@/hooks/use-theme'
import { getStreak, useHabitsStore } from '@/stores/habits-store'
import { EmptyState } from '@/components/ui/EmptyState'
import { hapticLight, hapticSuccess } from '@/utils/haptics'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Returns the last 7 days as YYYY-MM-DD strings, oldest first
function getLast7Days(): string[] {
  const days: string[] = []
  const d = new Date()
  for (let i = 6; i >= 0; i--) {
    const t = new Date(d)
    t.setDate(d.getDate() - i)
    days.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`)
  }
  return days
}

export default function HabitsScreen() {
  const theme = useTheme()
  const { habits, completions, addHabit, renameHabit, removeHabit, toggleCompletion } = useHabitsStore()

  const HABIT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#10b981']

  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [selectedColor, setSelectedColor] = useState(HABIT_COLORS[0])

  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameColor, setRenameColor] = useState(HABIT_COLORS[0])

  const today = getTodayString()
  const last7 = useMemo(() => getLast7Days(), [])

  function handleAdd() {
    if (!title.trim()) return
    hapticSuccess()
    addHabit(title.trim(), selectedColor)
    setTitle('')
    setSelectedColor(HABIT_COLORS[0])
    setModalVisible(false)
  }

  function openRename(id: string, current: string, color: string) {
    setRenameId(id)
    setRenameTitle(current)
    setRenameColor(color)
  }

  function handleRename() {
    if (!renameId || !renameTitle.trim()) return
    renameHabit(renameId, renameTitle.trim(), renameColor)
    setRenameId(null)
  }

  function handleExportCSV() {
    const header = 'Habit,Date\n'
    const rows = habits.flatMap((h) =>
      (completions[h.id] ?? []).sort().map((d) => `"${h.title}",${d}`)
    ).join('\n')
    Share.share({ message: header + rows, title: 'Habits Export' })
  }

  const completedToday = useMemo(() =>
    habits.filter((h) => (completions[h.id] ?? []).includes(today)).length,
    [habits, completions, today],
  )

  const yesterday = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const missedYesterday = useMemo(() =>
    habits.filter((h) => !(completions[h.id] ?? []).includes(yesterday)).length,
    [habits, completions, yesterday],
  )

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 96 }}>

        {/* Export button */}
        {habits.length > 0 && (
          <Pressable onPress={handleExportCSV} hitSlop={8} style={{ alignSelf: 'flex-end', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#3b82f6' }}>Export CSV</Text>
          </Pressable>
        )}

        {/* Overdue warning */}
        {habits.length > 0 && missedYesterday > 0 && (
          <View style={{
            backgroundColor: '#f59e0b22', borderRadius: 12, padding: 14,
            flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16,
          }}>
            <Text style={{ fontSize: 16 }}>⚠️</Text>
            <Text style={{ fontSize: 13, color: '#f59e0b', flex: 1, fontWeight: '500' }}>
              You missed {missedYesterday} habit{missedYesterday > 1 ? 's' : ''} yesterday. You can still log them below.
            </Text>
          </View>
        )}

        {/* Summary */}
        {habits.length > 0 && (
          <View style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16, padding: 20, marginBottom: 24,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginBottom: 4 }}>
              Today's Progress
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '700', color: theme.text, marginBottom: 2 }}>
              {completedToday}/{habits.length}
            </Text>
            <Text style={{ fontSize: 13, color: completedToday === habits.length ? '#22c55e' : theme.textSecondary }}>
              {completedToday === habits.length ? 'All done!' : `${habits.length - completedToday} remaining`}
            </Text>
            {/* Overall progress bar */}
            <View style={{ height: 6, backgroundColor: theme.backgroundSelected, borderRadius: 3, marginTop: 14 }}>
              <View style={{
                height: 6, borderRadius: 3,
                backgroundColor: completedToday === habits.length ? '#22c55e' : '#3b82f6',
                width: habits.length > 0 ? `${Math.round((completedToday / habits.length) * 100)}%` : '0%',
              }} />
            </View>
          </View>
        )}

        {/* Day labels */}
        {habits.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingRight: 4, marginBottom: 8, gap: 2 }}>
            {last7.map((d, i) => (
              <View key={d} style={{ width: 32, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 11, color: d === today ? '#3b82f6' : theme.textSecondary,
                  fontWeight: d === today ? '700' : '400',
                }}>
                  {DAYS[new Date(d + 'T00:00:00').getDay()]}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Habit rows */}
        {habits.length === 0 ? (
          <EmptyState emoji="✅" title="No habits yet" subtitle="Tap + to add your first daily habit." />
        ) : (
          <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
            {habits.map((habit, i) => {
              const dates = completions[habit.id] ?? []
              const streak = getStreak(dates, today)
              const doneToday = dates.includes(today)

              const renderRightActions = () => (
                <Pressable
                  onPress={() => removeHabit(habit.id)}
                  style={{
                    width: 80, backgroundColor: '#ef4444',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Delete</Text>
                </Pressable>
              )

              return (
                <Swipeable key={habit.id} renderRightActions={renderRightActions}>
                  <View
                    style={{
                      paddingHorizontal: 16, paddingVertical: 14,
                      flexDirection: 'row', alignItems: 'center',
                      borderBottomWidth: i < habits.length - 1 ? 1 : 0,
                      borderBottomColor: theme.backgroundSelected,
                      backgroundColor: theme.backgroundElement,
                    }}
                  >
                    {/* Color dot + title */}
                    <Pressable
                      onLongPress={() => openRename(habit.id, habit.title, habit.color)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    >
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: habit.color }} />
                      <View>
                        <Text style={{ fontSize: 15, color: theme.text }}>{habit.title}</Text>
                        <Text style={{ fontSize: 12, color: streak > 0 ? habit.color : theme.textSecondary, marginTop: 1 }}>
                          {streak > 0 ? `🔥 ${streak} day streak` : 'No streak yet'}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Last 7 day dots */}
                    <View style={{ flexDirection: 'row', gap: 2, marginRight: 12 }}>
                      {last7.map((d) => {
                        const done = dates.includes(d)
                        const isToday = d === today
                        return (
                          <Pressable
                            key={d}
                            onPress={() => {
                              hapticLight()
                              toggleCompletion(habit.id, d)
                            }}
                            hitSlop={4}
                            style={{
                              width: 32, height: 32, borderRadius: 8,
                              alignItems: 'center', justifyContent: 'center',
                              backgroundColor: done ? habit.color : theme.backgroundSelected,
                              borderWidth: isToday && !done ? 1.5 : 0,
                              borderColor: habit.color,
                            }}
                          >
                            {done && (
                              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>
                            )}
                          </Pressable>
                        )
                      })}
                    </View>

                    {/* Delete */}
                    <Pressable onPress={() => removeHabit(habit.id)} hitSlop={8}>
                      <Text style={{ color: theme.textSecondary, fontSize: 20, lineHeight: 22 }}>×</Text>
                    </Pressable>
                  </View>
                </Swipeable>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={{
          position: 'absolute', bottom: 32, right: 24,
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 28, lineHeight: 32 }}>+</Text>
      </Pressable>

      {/* Add habit modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{
                backgroundColor: theme.background,
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                padding: 24,
              }}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>
                New Habit
              </Text>
              <TextInput
                autoFocus
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Exercise, Read, Drink water"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 16,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {HABIT_COLORS.map((c) => (
                  <Pressable key={c} onPress={() => setSelectedColor(c)} hitSlop={6}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14, backgroundColor: c,
                      borderWidth: selectedColor === c ? 3 : 0,
                      borderColor: theme.background,
                      shadowColor: c, shadowOpacity: selectedColor === c ? 0.6 : 0,
                      shadowRadius: 4, elevation: selectedColor === c ? 4 : 0,
                    }} />
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={handleAdd}
                style={{ backgroundColor: selectedColor, borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Add Habit</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Rename habit modal */}
      <Modal
        visible={renameId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameId(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setRenameId(null)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}
            >
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>
                Rename Habit
              </Text>
              <TextInput
                autoFocus
                value={renameTitle}
                onChangeText={setRenameTitle}
                returnKeyType="done"
                onSubmitEditing={handleRename}
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 16,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                {HABIT_COLORS.map((c) => (
                  <Pressable key={c} onPress={() => setRenameColor(c)} hitSlop={6}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14, backgroundColor: c,
                      borderWidth: renameColor === c ? 3 : 0,
                      borderColor: theme.background,
                      shadowColor: c, shadowOpacity: renameColor === c ? 0.6 : 0,
                      shadowRadius: 4, elevation: renameColor === c ? 4 : 0,
                    }} />
                  </Pressable>
                ))}
              </View>
              <Pressable
                onPress={handleRename}
                style={{ backgroundColor: renameColor, borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  )
}
