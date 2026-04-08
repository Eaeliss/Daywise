import { useMemo, useRef, useState } from 'react'
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '@/hooks/use-theme'
import { useAuthStore } from '@/stores/auth-store'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { CalendarEvent, useCalendarStore } from '@/stores/calendar-store'
import { useGoalsStore } from '@/stores/goals-store'
import { useFinancesStore } from '@/stores/finances-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { formatShortDate, formatDayLabel } from '@/utils/format'
import { useHabitsStore, getStreak } from '@/stores/habits-store'
import { useSavingsStore } from '@/stores/savings-store'
import { useNotesStore } from '@/stores/notes-store'
import { DateInput } from '@/components/ui/DateInput'
import { TimeInput } from '@/components/ui/TimeInput'
import { useT } from '@/utils/i18n'

type GreetingKey = 'greeting_morning' | 'greeting_afternoon' | 'greeting_evening'
function getGreetingKey(hour: number): GreetingKey {
  if (hour < 12) return 'greeting_morning'
  if (hour < 17) return 'greeting_afternoon'
  return 'greeting_evening'
}

const QUICK_ACTIONS = [
  { label: 'Goals', route: '/(tabs)/goals' },
  { label: 'Habits', route: '/(tabs)/habits' },
  { label: 'Notes', route: '/(tabs)/notes' },
  { label: 'Calendar', route: '/(tabs)/calendar' },
  { label: 'Finances', route: '/(tabs)/finances' },
  { label: 'School', route: '/(tabs)/school' },
  { label: 'Stats', route: '/(tabs)/stats' },
] as const

export default function DashboardScreen() {
  const theme = useTheme()
  const tr = useT()
  const user = useAuthStore((s) => s.user)
  const storedName = useOnboardingStore((s) => s.displayName)
  const { addTransaction } = useFinancesStore()
  const { addHabit } = useHabitsStore()
  const { addNote } = useNotesStore()
  const { addEvent } = useCalendarStore()
  const { addGoal } = useGoalsStore()

  const [quickModal, setQuickModal] = useState(false)
  const [quickTab, setQuickTab] = useState<'transaction' | 'habit' | 'note' | 'event' | 'goal'>('transaction')
  const [quickTitle, setQuickTitle] = useState('')
  const [quickAmount, setQuickAmount] = useState('')
  const [quickBody, setQuickBody] = useState('')
  const [quickEventDate, setQuickEventDate] = useState('')
  const [quickEventTime, setQuickEventTime] = useState('')
  const [quickTransactionDate, setQuickTransactionDate] = useState('')
  const [quickGoalDate, setQuickGoalDate] = useState('')
  const shakeAnim = useRef(new Animated.Value(0)).current

  function shakeButton() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start()
  }

  function resetQuickFields() {
    setQuickTitle('')
    setQuickAmount('')
    setQuickBody('')
    setQuickEventDate('')
    setQuickEventTime('')
    setQuickTransactionDate('')
    setQuickGoalDate('')
  }

  function handleQuickAdd() {
    const d = new Date()
    const todayStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

    if (quickTab === 'transaction') {
      if (!quickTitle.trim()) { shakeButton(); return }
      const amt = parseFloat(quickAmount.replace(',', '.'))
      if (isNaN(amt) || amt <= 0) { shakeButton(); return }
      addTransaction(quickTitle.trim(), amt, 'expense', 'Other', quickTransactionDate || todayStr)
    } else if (quickTab === 'habit') {
      if (!quickTitle.trim()) { shakeButton(); return }
      addHabit(quickTitle.trim())
    } else if (quickTab === 'note') {
      if (!quickTitle.trim() && !quickBody.trim()) { shakeButton(); return }
      addNote(quickTitle.trim(), quickBody.trim())
    } else if (quickTab === 'event') {
      if (!quickTitle.trim()) { shakeButton(); return }
      const eventDate = quickEventDate || todayStr
      const time = quickEventTime.trim()
      const validTime = /^\d{1,2}:\d{2}$/.test(time) ? time : ''
      addEvent(quickTitle.trim(), eventDate, eventDate, validTime, 'none')
    } else if (quickTab === 'goal') {
      if (!quickTitle.trim()) { shakeButton(); return }
      addGoal(quickTitle.trim(), quickBody.trim(), quickGoalDate, 0)
    }
    resetQuickFields()
    setQuickModal(false)
  }
  const events = useCalendarStore((s) => s.events)
  const { habits, completions } = useHabitsStore()
  const { goals: savingsGoals } = useSavingsStore()
  const goals = useGoalsStore((s) => s.goals)
  const { transactions, monthlyIncome, budgetMode, budgetPercent, budgetFixed } = useFinancesStore()
  const currency = usePreferencesStore((s) => s.currency)
  const language = usePreferencesStore((s) => s.language)

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayLabel = formatDayLabel(now, language)
  const greeting = tr(getGreetingKey(now.getHours()))
  const displayName = storedName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  const fmt = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency, notation: 'compact' }),
    [currency, language],
  )

  const { goalStats, nextGoal } = useMemo(() => {
    let active = 0
    let overdue = 0
    let next = null as typeof goals[0] | null
    for (const g of goals) {
      if (g.completed) continue
      active++
      if (g.targetDate !== '' && g.targetDate < today) { overdue++; continue }
      if (g.targetDate !== '' && (!next || g.targetDate < next.targetDate)) next = g
    }
    return { goalStats: { active, overdue }, nextGoal: next }
  }, [goals, today])

  const { balance, totalExpenses } = useMemo(() => {
    let income = 0
    let expenses = 0
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount
      else expenses += t.amount
    }
    return { balance: income - expenses, totalExpenses: expenses }
  }, [transactions])

  const effectiveBudget = useMemo(() => {
    if (monthlyIncome <= 0) return 0
    if (budgetMode === 'percentage') return (monthlyIncome * budgetPercent) / 100
    return budgetFixed
  }, [monthlyIncome, budgetMode, budgetPercent, budgetFixed])

  const habitSummary = useMemo(() => {
    if (habits.length === 0) return null
    let doneToday = 0
    let bestStreak = 0
    for (const h of habits) {
      const dates = completions[h.id] ?? []
      if (dates.includes(today)) doneToday++
      const s = getStreak(dates, today)
      if (s > bestStreak) bestStreak = s
    }
    return { doneToday, total: habits.length, bestStreak }
  }, [habits, completions, today])

  const topSavingsGoal = useMemo(() => {
    const active = savingsGoals.filter((g) => g.savedAmount < g.targetAmount)
    if (active.length === 0) return null
    return active.reduce((best, g) => {
      const pct = g.savedAmount / g.targetAmount
      const bestPct = best.savedAmount / best.targetAmount
      return pct > bestPct ? g : best
    })
  }, [savingsGoals])

  const { todayEvents, upcomingEvents } = useMemo(() => {
    const todayArr: CalendarEvent[] = []
    const futureArr: CalendarEvent[] = []
    for (const e of events) {
      if (e.date === today) todayArr.push(e)
      else if (e.date > today) futureArr.push(e)
    }
    futureArr.sort((a, b) => a.date.localeCompare(b.date))
    return { todayEvents: todayArr, upcomingEvents: futureArr.slice(0, 5) }
  }, [events, today])

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28 }}>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 4 }}>
          {todayLabel}
        </Text>
        <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text }}>
          {greeting}, {displayName}
        </Text>
      </View>

      {/* Widgets row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 28 }}>
        {/* Goals widget */}
        <Pressable
          onPress={() => router.push('/(tabs)/goals')}
          style={{
            flex: 1, backgroundColor: theme.backgroundElement,
            borderRadius: 16, padding: 16,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: 8 }}>
            {tr('goals')}
          </Text>
          <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
            {goalStats.active}
          </Text>
          <Text style={{ fontSize: 12, color: goalStats.overdue > 0 ? '#ef4444' : '#22c55e' }}>
            {goalStats.overdue > 0 ? `${goalStats.overdue} overdue` : 'On track'}
          </Text>
        </Pressable>

        {/* Finance widget */}
        <Pressable
          onPress={() => router.push('/(tabs)/finances')}
          style={{
            flex: 1, backgroundColor: theme.backgroundElement,
            borderRadius: 16, padding: 16,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: 8 }}>
            {tr('balance')}
          </Text>
          <Text style={{
            fontSize: 28, fontWeight: '700', marginBottom: 4,
            color: balance >= 0 ? '#22c55e' : '#ef4444',
          }}>
            {fmt.format(balance)}
          </Text>
          <Text style={{ fontSize: 12, color: '#ef4444', marginBottom: effectiveBudget > 0 ? 10 : 0 }}>
            {totalExpenses > 0 ? `-${fmt.format(totalExpenses)} spent` : 'No expenses'}
          </Text>
          {effectiveBudget > 0 && (() => {
            const pct = Math.min(totalExpenses / effectiveBudget, 1)
            const overBudget = totalExpenses > effectiveBudget
            const barColor = overBudget ? '#ef4444' : pct > 0.8 ? '#f59e0b' : '#22c55e'
            return (
              <>
                <View style={{ height: 4, backgroundColor: theme.backgroundSelected, borderRadius: 2, marginBottom: 4 }}>
                  <View style={{ height: 4, borderRadius: 2, backgroundColor: barColor, width: `${Math.round(pct * 100)}%` }} />
                </View>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                  {Math.round(pct * 100)}% of budget
                </Text>
              </>
            )
          })()}
        </Pressable>
      </View>

      {/* Habits + Savings widgets row */}
      {(habitSummary || topSavingsGoal) && (
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 28 }}>
          {habitSummary && (
            <Pressable
              onPress={() => router.push('/(tabs)/habits')}
              style={{ flex: 1, backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: 8 }}>{tr('habits')}</Text>
              <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 4 }}>
                {habitSummary.doneToday}/{habitSummary.total}
              </Text>
              <Text style={{ fontSize: 12, color: habitSummary.bestStreak > 0 ? '#f59e0b' : theme.textSecondary }}>
                {habitSummary.bestStreak > 0 ? `🔥 ${habitSummary.bestStreak}d streak` : 'Today'}
              </Text>
            </Pressable>
          )}
          {topSavingsGoal && (
            <Pressable
              onPress={() => router.push('/(tabs)/finances')}
              style={{ flex: 1, backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16 }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: 8 }}>{tr('savingFor')}</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 8 }} numberOfLines={1}>
                {topSavingsGoal.title}
              </Text>
              <View style={{ height: 4, backgroundColor: theme.backgroundSelected, borderRadius: 2, marginBottom: 4 }}>
                <View style={{
                  height: 4, borderRadius: 2,
                  backgroundColor: topSavingsGoal.color,
                  width: `${Math.round((topSavingsGoal.savedAmount / topSavingsGoal.targetAmount) * 100)}%`,
                }} />
              </View>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                {Math.round((topSavingsGoal.savedAmount / topSavingsGoal.targetAmount) * 100)}% saved
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Budget card */}
      {effectiveBudget > 0 && (() => {
        const pct = Math.min(totalExpenses / effectiveBudget, 1)
        const overBudget = totalExpenses > effectiveBudget
        const barColor = overBudget ? '#ef4444' : pct > 0.8 ? '#f59e0b' : '#22c55e'
        const remaining = effectiveBudget - totalExpenses
        return (
          <Pressable
            onPress={() => router.push('/(tabs)/finances')}
            style={{ marginHorizontal: 20, marginBottom: 28 }}
          >
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary }}>{tr('monthlyBudget')}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: overBudget ? '#ef4444' : '#22c55e' }}>
                  {overBudget ? `Over by ${fmt.format(Math.abs(remaining))}` : `${fmt.format(remaining)} left`}
                </Text>
              </View>
              <View style={{ height: 6, backgroundColor: theme.backgroundSelected, borderRadius: 3, marginBottom: 6 }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: barColor, width: `${Math.round(pct * 100)}%` }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>{fmt.format(totalExpenses)} spent</Text>
                <Text style={{ fontSize: 11, color: theme.textSecondary }}>{fmt.format(effectiveBudget)} budget</Text>
              </View>
            </View>
          </Pressable>
        )
      })()}

      {/* Next Goal card */}
      {nextGoal && (() => {
        const msPerDay = 86400000
        const daysLeft = Math.ceil(
          (new Date(nextGoal.targetDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / msPerDay
        )
        const urgentColor = daysLeft <= 3 ? '#ef4444' : daysLeft <= 7 ? '#f59e0b' : '#3b82f6'
        return (
          <Pressable
            onPress={() => router.push('/(tabs)/goals')}
            style={{ marginHorizontal: 20, marginBottom: 28 }}
          >
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 16, padding: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: 8 }}>
                {tr('nextGoalDeadline')}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text, flex: 1, marginRight: 12 }} numberOfLines={1}>
                  {nextGoal.title}
                </Text>
                <View style={{ backgroundColor: urgentColor + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: urgentColor }}>
                    {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                  </Text>
                </View>
              </View>
              {nextGoal.description !== '' && (
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6 }} numberOfLines={1}>
                  {nextGoal.description}
                </Text>
              )}
            </View>
          </Pressable>
        )
      })()}

      {/* Today's events */}
      <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 12,
        }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>{tr('today')}</Text>
          <Pressable onPress={() => router.push('/(tabs)/calendar')} hitSlop={8}>
            <Text style={{ fontSize: 13, color: '#3b82f6' }}>{tr('viewCalendar')}</Text>
          </Pressable>
        </View>

        <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
          {todayEvents.length === 0 ? (
            <Text style={{
              color: theme.textSecondary, padding: 16,
              textAlign: 'center', fontSize: 14,
            }}>
              {tr('noEventsToday')}
            </Text>
          ) : (
            todayEvents.map((event, i) => (
              <View
                key={event.id}
                style={{
                  paddingHorizontal: 16, paddingVertical: 13,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  borderBottomWidth: i < todayEvents.length - 1 ? 1 : 0,
                  borderBottomColor: theme.backgroundSelected,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
                <Text style={{ fontSize: 15, color: theme.text }}>{event.title}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
            {tr('upcoming')}
          </Text>
          <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
            {upcomingEvents.map((event, i) => (
              <View
                key={event.id}
                style={{
                  paddingHorizontal: 16, paddingVertical: 13,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  borderBottomWidth: i < upcomingEvents.length - 1 ? 1 : 0,
                  borderBottomColor: theme.backgroundSelected,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' }} />
                  <Text style={{ fontSize: 15, color: theme.text }}>{event.title}</Text>
                </View>
                <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                  {formatShortDate(event.date, language)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick actions */}
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
          {tr('quickActions')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route)}
              style={{
                width: '30%', flexGrow: 1, backgroundColor: theme.backgroundElement,
                borderRadius: 12, paddingVertical: 18, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>

    {/* Quick-add FAB */}
    <Pressable
      onPress={() => { setQuickTab('transaction'); resetQuickFields(); setQuickModal(true) }}
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

    {/* Quick-add modal */}
    <Modal visible={quickModal} transparent animationType="fade" onRequestClose={() => setQuickModal(false)}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setQuickModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View
            onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
            style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '90%' }}
          >
            <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>{tr('quickAdd')}</Text>
            {/* Tab row 1: Expense / Habit / Note */}
            <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 3, marginBottom: 6 }}>
              {(['transaction', 'habit', 'note'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setQuickTab(t); resetQuickFields() }}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: quickTab === t ? theme.background : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: quickTab === t ? '#3b82f6' : theme.textSecondary }}>
                    {t === 'transaction' ? 'Expense' : t === 'habit' ? 'Habit' : 'Note'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {/* Tab row 2: Event / Goal */}
            <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {(['event', 'goal'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => { setQuickTab(t); resetQuickFields() }}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: quickTab === t ? theme.background : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: quickTab === t ? '#3b82f6' : theme.textSecondary }}>
                    {t === 'event' ? 'Event' : 'Goal'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Title / name field */}
              <TextInput
                autoFocus
                value={quickTitle}
                onChangeText={setQuickTitle}
                placeholder={
                  quickTab === 'transaction' ? 'Description' :
                  quickTab === 'habit' ? 'Habit name' :
                  quickTab === 'note' ? 'Note title (optional)' :
                  quickTab === 'event' ? 'Event title' : 'Goal title'
                }
                placeholderTextColor={theme.textSecondary}
                returnKeyType="next"
                style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10 }}
              />

              {/* Amount + date — Expense */}
              {quickTab === 'transaction' && (
                <>
                  <TextInput
                    value={quickAmount}
                    onChangeText={setQuickAmount}
                    placeholder="Amount"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleQuickAdd}
                    style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10 }}
                  />
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>Date (defaults to today)</Text>
                  <View style={{ marginBottom: 10 }}>
                    <DateInput value={quickTransactionDate} onChange={setQuickTransactionDate} />
                  </View>
                </>
              )}

              {/* Date + time — Event */}
              {quickTab === 'event' && (
                <>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>Date (defaults to today)</Text>
                  <View style={{ marginBottom: 10 }}>
                    <DateInput value={quickEventDate} onChange={setQuickEventDate} />
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <TimeInput value={quickEventTime} onChange={setQuickEventTime} />
                  </View>
                </>
              )}

              {/* Description + deadline — Goal */}
              {quickTab === 'goal' && (
                <>
                  <TextInput
                    value={quickBody}
                    onChangeText={setQuickBody}
                    placeholder="Description (optional)"
                    placeholderTextColor={theme.textSecondary}
                    multiline
                    style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10, minHeight: 72, textAlignVertical: 'top' }}
                  />
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 6 }}>Deadline (optional)</Text>
                  <View style={{ marginBottom: 10 }}>
                    <DateInput value={quickGoalDate} onChange={setQuickGoalDate} />
                  </View>
                </>
              )}

              {/* Body — Note only */}
              {quickTab === 'note' && (
                <TextInput
                  value={quickBody}
                  onChangeText={setQuickBody}
                  placeholder="Write something..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10, minHeight: 72, textAlignVertical: 'top' }}
                />
              )}

              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <Pressable onPress={handleQuickAdd} style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Add</Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
    </View>
  )
}
