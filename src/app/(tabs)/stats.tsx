import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '@/hooks/use-theme'
import { usePreferencesStore } from '@/stores/preferences-store'
import { useFinancesStore } from '@/stores/finances-store'
import { useGoalsStore } from '@/stores/goals-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { useHabitsStore, getStreak } from '@/stores/habits-store'
import { useSavingsStore } from '@/stores/savings-store'
import { useNotesStore } from '@/stores/notes-store'

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCurrentMonthPrefix() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getLast30Days(): string[] {
  const days: string[] = []
  const d = new Date()
  for (let i = 29; i >= 0; i--) {
    const t = new Date(d)
    t.setDate(d.getDate() - i)
    days.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`)
  }
  return days
}

type StatCardProps = {
  label: string
  value: string
  sub?: string
  color?: string
  theme: ReturnType<typeof import('@/hooks/use-theme').useTheme>
}

function StatCard({ label, value, sub, color = '#3b82f6', theme }: StatCardProps) {
  return (
    <View style={{
      flex: 1, backgroundColor: theme.backgroundElement,
      borderRadius: 14, padding: 16, minWidth: '45%',
    }}>
      <Text style={{ fontSize: 12, fontWeight: '500', color: theme.textSecondary, marginBottom: 6 }}>{label}</Text>
      <Text style={{ fontSize: 26, fontWeight: '700', color, marginBottom: sub ? 2 : 0 }}>{value}</Text>
      {sub && <Text style={{ fontSize: 12, color: theme.textSecondary }}>{sub}</Text>}
    </View>
  )
}

type SectionProps = { title: string; theme: ReturnType<typeof import('@/hooks/use-theme').useTheme>; children: React.ReactNode }
function Section({ title, theme, children }: SectionProps) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {children}
      </View>
    </View>
  )
}

export default function StatsScreen() {
  const theme = useTheme()
  const currency = usePreferencesStore((s) => s.currency)
  const language = usePreferencesStore((s) => s.language)
  const [range, setRange] = useState<'all' | 'month'>('all')

  const { transactions, monthlyIncome, budgetMode, budgetPercent, budgetFixed } = useFinancesStore()
  const { goals } = useGoalsStore()
  const { events } = useCalendarStore()
  const { habits, completions } = useHabitsStore()
  const { goals: savingsGoals } = useSavingsStore()
  const { notes } = useNotesStore()

  const today = getTodayString()
  const monthPrefix = getCurrentMonthPrefix()
  const last30 = useMemo(() => getLast30Days(), [])

  const filteredTransactions = useMemo(
    () => range === 'month' ? transactions.filter((t) => t.date.startsWith(monthPrefix)) : transactions,
    [transactions, range, monthPrefix],
  )
  const filteredEvents = useMemo(
    () => range === 'month' ? events.filter((e) => e.date.startsWith(monthPrefix)) : events,
    [events, range, monthPrefix],
  )

  const fmt = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency, notation: 'compact' }),
    [currency, language],
  )

  // --- Finances ---
  const { totalIncome, totalExpenses, balance, effectiveBudget } = useMemo(() => {
    let income = 0
    let expenses = 0
    for (const t of filteredTransactions) {
      if (t.type === 'income') income += t.amount
      else expenses += t.amount
    }
    let budget = 0
    if (monthlyIncome > 0) {
      budget = budgetMode === 'percentage' ? (monthlyIncome * budgetPercent) / 100 : budgetFixed
    }
    return { totalIncome: income, totalExpenses: expenses, balance: income - expenses, effectiveBudget: budget }
  }, [filteredTransactions, monthlyIncome, budgetMode, budgetPercent, budgetFixed])

  const budgetPct = effectiveBudget > 0 ? Math.round((totalExpenses / effectiveBudget) * 100) : null

  // --- Goals ---
  const { activeGoals, completedGoals, overdueGoals } = useMemo(() => {
    let active = 0, completed = 0, overdue = 0
    for (const g of goals) {
      if (g.completed) { completed++; continue }
      active++
      if (g.targetDate && g.targetDate < today) overdue++
    }
    return { activeGoals: active, completedGoals: completed, overdueGoals: overdue }
  }, [goals, today])

  const goalCompletionRate = goals.length > 0
    ? Math.round((completedGoals / goals.length) * 100)
    : 0

  // --- Habits ---
  const { bestStreak, last30Rate, todayDone } = useMemo(() => {
    let best = 0
    let todayDone = 0
    let totalPossible = habits.length * 30
    let totalDone = 0

    for (const h of habits) {
      const dates = completions[h.id] ?? []
      const s = getStreak(dates, today)
      if (s > best) best = s
      if (dates.includes(today)) todayDone++
      for (const d of last30) {
        if (dates.includes(d)) totalDone++
      }
    }

    const rate = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0
    return { bestStreak: best, last30Rate: rate, todayDone }
  }, [habits, completions, today, last30])

  // --- Savings ---
  const { totalSaved, totalTarget, savingsRate } = useMemo(() => {
    let saved = 0, target = 0
    for (const g of savingsGoals) {
      saved += g.savedAmount
      target += g.targetAmount
    }
    const rate = target > 0 ? Math.round((saved / target) * 100) : 0
    return { totalSaved: saved, totalTarget: target, savingsRate: rate }
  }, [savingsGoals])

  // --- Calendar ---
  const { eventsCount, upcomingCount } = useMemo(() => {
    let count = 0, upcoming = 0
    for (const e of filteredEvents) {
      count++
      if (e.date > today) upcoming++
    }
    return { eventsCount: count, upcomingCount: upcoming }
  }, [filteredEvents, today])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      {/* Range toggle */}
      <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 3, marginBottom: 24 }}>
        {(['all', 'month'] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: range === r ? theme.background : 'transparent' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: range === r ? '#3b82f6' : theme.textSecondary }}>
              {r === 'all' ? 'All Time' : 'This Month'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Finances */}
      <Section title="Finances" theme={theme}>
        <StatCard label="Balance" value={fmt.format(balance)} color={balance >= 0 ? '#22c55e' : '#ef4444'} theme={theme} />
        <StatCard label="Total Income" value={fmt.format(totalIncome)} color="#22c55e" theme={theme} />
        <StatCard label="Total Expenses" value={fmt.format(totalExpenses)} color="#ef4444" theme={theme} />
        {budgetPct !== null && (
          <StatCard
            label="Budget Used"
            value={`${budgetPct}%`}
            sub={`${fmt.format(totalExpenses)} of ${fmt.format(effectiveBudget)}`}
            color={budgetPct > 100 ? '#ef4444' : budgetPct > 80 ? '#f59e0b' : '#22c55e'}
            theme={theme}
          />
        )}
        {savingsGoals.length > 0 && (
          <StatCard
            label="Total Saved"
            value={fmt.format(totalSaved)}
            sub={`${savingsRate}% of ${fmt.format(totalTarget)} target`}
            color="#6366f1"
            theme={theme}
          />
        )}
      </Section>

      {/* Habits */}
      {habits.length > 0 && (
        <Section title="Habits" theme={theme}>
          <StatCard label="Total Habits" value={String(habits.length)} theme={theme} />
          <StatCard
            label="Done Today"
            value={`${todayDone}/${habits.length}`}
            color={todayDone === habits.length ? '#22c55e' : '#3b82f6'}
            theme={theme}
          />
          <StatCard
            label="30-Day Rate"
            value={`${last30Rate}%`}
            sub="completion across all habits"
            color={last30Rate >= 80 ? '#22c55e' : last30Rate >= 50 ? '#f59e0b' : '#ef4444'}
            theme={theme}
          />
          <StatCard
            label="Best Streak"
            value={`${bestStreak}d`}
            sub="consecutive days"
            color="#f59e0b"
            theme={theme}
          />
        </Section>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <Section title="Goals" theme={theme}>
          <StatCard label="Active" value={String(activeGoals)} color="#3b82f6" theme={theme} />
          <StatCard label="Completed" value={String(completedGoals)} color="#22c55e" theme={theme} />
          {overdueGoals > 0 && (
            <StatCard label="Overdue" value={String(overdueGoals)} color="#ef4444" theme={theme} />
          )}
          <StatCard
            label="Completion Rate"
            value={`${goalCompletionRate}%`}
            color={goalCompletionRate >= 70 ? '#22c55e' : '#f59e0b'}
            theme={theme}
          />
        </Section>
      )}

      {/* Calendar & Notes */}
      <Section title="Activity" theme={theme}>
        <StatCard label={range === 'month' ? 'Events This Month' : 'Total Events'} value={String(eventsCount)} theme={theme} />
        {range === 'all' && <StatCard label="Upcoming Events" value={String(upcomingCount)} theme={theme} />}
        {notes.length > 0 && (
          <StatCard label="Notes" value={String(notes.length)} theme={theme} />
        )}
        {savingsGoals.length > 0 && (
          <StatCard label="Savings Goals" value={String(savingsGoals.length)} sub={`${savingsGoals.filter(g => g.savedAmount >= g.targetAmount).length} reached`} theme={theme} />
        )}
      </Section>
    </ScrollView>
  )
}
