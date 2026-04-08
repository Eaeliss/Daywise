import { useMemo, useState } from 'react'
import {
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
import { TimeInput } from '@/components/ui/TimeInput'
import { DateInput } from '@/components/ui/DateInput'
import { CalendarRepeat, eventCoversDate, useCalendarStore } from '@/stores/calendar-store'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const REPEAT_OPTIONS: { value: CalendarRepeat; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function toDateString(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getTodayString() {
  const d = new Date()
  return toDateString(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function CalendarScreen() {
  const theme = useTheme()
  const today = getTodayString()

  const [year, setYear] = useState(() => parseInt(today.slice(0, 4), 10))
  const [month, setMonth] = useState(() => parseInt(today.slice(5, 7), 10) - 1)
  const [selected, setSelected] = useState(today)
  const [modalVisible, setModalVisible] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [newRepeat, setNewRepeat] = useState<CalendarRepeat>('none')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editRepeat, setEditRepeat] = useState<CalendarRepeat>('none')

  const { events, addEvent, updateEvent, removeEvent } = useCalendarStore()

  function openEdit(event: { id: string; title: string; endDate: string; time: string; repeat: CalendarRepeat }) {
    setEditingId(event.id)
    setEditTitle(event.title)
    setEditEndDate(event.endDate !== event.id ? event.endDate : '')
    setEditTime(event.time)
    setEditRepeat(event.repeat)
  }

  function handleEditSave() {
    if (!editingId || !editTitle.trim()) return
    const time = editTime.trim()
    const ev = events.find((e) => e.id === editingId)
    if (!ev) return
    const endDate = editEndDate && editEndDate >= ev.date ? editEndDate : ev.date
    updateEvent(editingId, editTitle.trim(), endDate, /^\d{1,2}:\d{2}$/.test(time) ? time : '', editRepeat)
    setEditingId(null)
  }

  // Build calendar grid: leading nulls + days 1..N + trailing nulls
  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const result: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ]
    while (result.length % 7 !== 0) result.push(null)
    return result
  }, [year, month])

  // Compute which dates in this month have events (including multi-day and repeat)
  const eventDates = useMemo(() => {
    const dates = new Set<string>()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateString(year, month, day)
      for (const event of events) {
        if (eventCoversDate(event, dateStr)) {
          dates.add(dateStr)
          break
        }
      }
    }
    return dates
  }, [events, year, month])

  const dayEvents = useMemo(
    () => events.filter((e) => eventCoversDate(e, selected)),
    [events, selected],
  )

  function prevMonth() {
    const newMonth = month === 0 ? 11 : month - 1
    const newYear = month === 0 ? year - 1 : year
    setMonth(newMonth)
    setYear(newYear)
    setSelected(toDateString(newYear, newMonth, 1))
  }

  function nextMonth() {
    const newMonth = month === 11 ? 0 : month + 1
    const newYear = month === 11 ? year + 1 : year
    setMonth(newMonth)
    setYear(newYear)
    setSelected(toDateString(newYear, newMonth, 1))
  }

  function goToToday() {
    const d = new Date()
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSelected(getTodayString())
  }

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth()

  function handleAddEvent() {
    if (!newTitle.trim()) return
    const time = newTime.trim()
    const validTime = /^\d{1,2}:\d{2}$/.test(time) ? time : ''
    const endDate = newEndDate && newEndDate >= selected ? newEndDate : selected
    addEvent(newTitle.trim(), selected, endDate, validTime, newRepeat)
    setNewTitle('')
    setNewEndDate('')
    setNewTime('')
    setNewRepeat('none')
    setModalVisible(false)
  }

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number)
    return `${MONTHS[m - 1]} ${d}, ${y}`
  }, [selected])

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Month navigation */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
      }}>
        <Pressable onPress={prevMonth} hitSlop={12}>
          <Text style={{ fontSize: 24, color: theme.text, lineHeight: 28 }}>‹</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text }}>
            {MONTHS[month]} {year}
          </Text>
          {!isCurrentMonth && (
            <Pressable onPress={goToToday} hitSlop={8}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6' }}>Today</Text>
            </Pressable>
          )}
        </View>
        <Pressable onPress={nextMonth} hitSlop={12}>
          <Text style={{ fontSize: 24, color: theme.text, lineHeight: 28 }}>›</Text>
        </Pressable>
      </View>

      {/* Day-of-week headers */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, marginBottom: 4 }}>
        {DAYS.map((d) => (
          <View key={d} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ paddingHorizontal: 12 }}>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row' }}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              if (!day) return <View key={col} style={{ flex: 1, height: 48 }} />

              const dateStr = toDateString(year, month, day)
              const isToday = dateStr === today
              const isSelected = dateStr === selected
              const hasEvents = eventDates.has(dateStr)

              return (
                <Pressable
                  key={col}
                  onPress={() => setSelected(dateStr)}
                  style={{ flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' }}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected
                      ? '#3b82f6'
                      : isToday
                        ? theme.backgroundElement
                        : 'transparent',
                  }}>
                    <Text style={{
                      fontSize: 15,
                      fontWeight: isToday ? '700' : '400',
                      color: isSelected ? '#fff' : theme.text,
                    }}>
                      {day}
                    </Text>
                  </View>
                  {hasEvents && (
                    <View style={{
                      width: 4, height: 4, borderRadius: 2,
                      backgroundColor: isSelected ? '#fff' : '#3b82f6',
                      marginTop: 2,
                    }} />
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={{
        height: 1, backgroundColor: theme.backgroundElement,
        marginTop: 12, marginHorizontal: 20,
      }} />

      {/* Selected date label */}
      <Text style={{
        fontSize: 13, fontWeight: '600', color: theme.textSecondary,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
      }}>
        {formattedSelectedDate}
      </Text>

      {/* Events list */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }} contentContainerStyle={{ paddingBottom: 96 }}>
        {dayEvents.length === 0 ? (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 24, fontSize: 14 }}>
            No events
          </Text>
        ) : (
          [...dayEvents]
            .sort((a, b) => {
              if (!a.time && !b.time) return 0
              if (!a.time) return 1
              if (!b.time) return -1
              return a.time.localeCompare(b.time)
            })
            .map((event) => (
            <View key={event.id} style={{
              flexDirection: 'row', alignItems: 'center',
              borderBottomWidth: 1, borderBottomColor: theme.backgroundElement,
            }}>
              <Pressable onPress={() => openEdit({
                id: event.id, title: event.title,
                endDate: event.endDate, time: event.time, repeat: event.repeat,
              })} style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
                paddingVertical: 14,
              }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, color: theme.text }}>{event.title}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                    {event.time !== '' && (
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>{event.time}</Text>
                    )}
                    {event.endDate !== event.date && (
                      <Text style={{ fontSize: 12, color: '#3b82f6' }}>
                        {event.date} → {event.endDate}
                      </Text>
                    )}
                    {event.repeat !== 'none' && (
                      <Text style={{ fontSize: 12, color: '#8b5cf6' }}>
                        🔁 {event.repeat}
                      </Text>
                    )}
                  </View>
                </View>
              </Pressable>
              <Pressable onPress={() => removeEvent(event.id)} hitSlop={8} style={{ paddingVertical: 14, paddingLeft: 8 }}>
                <Text style={{ color: theme.textSecondary, fontSize: 20, lineHeight: 22 }}>×</Text>
              </Pressable>
            </View>
          ))
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

      {/* Add event modal */}
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
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 4 }}>
                  New Event
                </Text>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
                  {formattedSelectedDate}
                </Text>
                <TextInput
                  autoFocus
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Event title"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="next"
                  style={{
                    backgroundColor: theme.backgroundElement,
                    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 15, color: theme.text, marginBottom: 10,
                  }}
                />
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>Time</Text>
                <View style={{ marginBottom: 14 }}>
                  <TimeInput value={newTime} onChange={setNewTime} />
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>End date (optional)</Text>
                <View style={{ marginBottom: 14 }}>
                  <DateInput value={newEndDate} onChange={setNewEndDate} />
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>Repeat</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {REPEAT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => setNewRepeat(opt.value)}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                        backgroundColor: newRepeat === opt.value ? '#3b82f6' : theme.backgroundElement,
                      }}
                    >
                      <Text style={{
                        fontSize: 12, fontWeight: '600',
                        color: newRepeat === opt.value ? '#fff' : theme.textSecondary,
                      }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={handleAddEvent}
                  style={{
                    backgroundColor: '#3b82f6', borderRadius: 10,
                    paddingVertical: 14, alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Add Event</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit event modal */}
      <Modal
        visible={editingId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingId(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setEditingId(null)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}
            >
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>
                  Edit Event
                </Text>
                <TextInput
                  autoFocus
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Event title"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="next"
                  style={{
                    backgroundColor: theme.backgroundElement,
                    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                    fontSize: 15, color: theme.text, marginBottom: 10,
                  }}
                />
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>Time</Text>
                <View style={{ marginBottom: 14 }}>
                  <TimeInput value={editTime} onChange={setEditTime} />
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>End date (optional)</Text>
                <View style={{ marginBottom: 14 }}>
                  <DateInput value={editEndDate} onChange={setEditEndDate} />
                </View>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 8 }}>Repeat</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {REPEAT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      onPress={() => setEditRepeat(opt.value)}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                        backgroundColor: editRepeat === opt.value ? '#3b82f6' : theme.backgroundElement,
                      }}
                    >
                      <Text style={{
                        fontSize: 12, fontWeight: '600',
                        color: editRepeat === opt.value ? '#fff' : theme.textSecondary,
                      }}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={handleEditSave}
                  style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save</Text>
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  )
}
