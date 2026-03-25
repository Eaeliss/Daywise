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
import { useCalendarStore } from '@/stores/calendar-store'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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
  const [newTime, setNewTime] = useState('')

  const [editingEvent, setEditingEvent] = useState<{ id: string; title: string; time: string } | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editTime, setEditTime] = useState('')

  const { events, addEvent, updateEvent, removeEvent } = useCalendarStore()

  function openEdit(event: { id: string; title: string; time: string }) {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditTime(event.time)
  }

  function handleEditSave() {
    if (!editingEvent || !editTitle.trim()) return
    const time = editTime.trim()
    updateEvent(editingEvent.id, editTitle.trim(), /^\d{1,2}:\d{2}$/.test(time) ? time : '')
    setEditingEvent(null)
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

  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), [events])
  const dayEvents = useMemo(() => events.filter((e) => e.date === selected), [events, selected])

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
    addEvent(newTitle.trim(), selected, validTime)
    setNewTitle('')
    setNewTime('')
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
              <Pressable onPress={() => openEdit(event)} style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
                paddingVertical: 14,
              }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
                <View>
                  <Text style={{ fontSize: 15, color: theme.text }}>{event.title}</Text>
                  {event.time !== '' && (
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 1 }}>{event.time}</Text>
                  )}
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
              <View style={{ marginBottom: 16 }}>
                <TimeInput value={newTime} onChange={setNewTime} />
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
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit event modal */}
      <Modal
        visible={editingEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingEvent(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setEditingEvent(null)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}
            >
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
              <View style={{ marginBottom: 16 }}>
                <TimeInput value={editTime} onChange={setEditTime} />
              </View>
              <Pressable
                onPress={handleEditSave}
                style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
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
