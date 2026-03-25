import { useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '@/hooks/use-theme'
import { useNotesStore } from '@/stores/notes-store'
import { useFinancesStore } from '@/stores/finances-store'
import { useGoalsStore } from '@/stores/goals-store'
import { useHabitsStore } from '@/stores/habits-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { formatShortDate } from '@/utils/format'

type ResultItem =
  | { kind: 'note'; id: string; title: string; sub: string; date: string }
  | { kind: 'transaction'; id: string; title: string; sub: string; amount: string; income: boolean }
  | { kind: 'goal'; id: string; title: string; sub: string; completed: boolean }
  | { kind: 'habit'; id: string; title: string; sub: string; color: string }
  | { kind: 'event'; id: string; title: string; sub: string; date: string }

export default function SearchScreen() {
  const theme = useTheme()
  const [query, setQuery] = useState('')

  const { notes } = useNotesStore()
  const { transactions } = useFinancesStore()
  const { goals } = useGoalsStore()
  const { habits } = useHabitsStore()
  const { events } = useCalendarStore()
  const currency = usePreferencesStore((s) => s.currency)
  const language = usePreferencesStore((s) => s.language)

  const fmt = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency }),
    [currency, language],
  )

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: ResultItem[] = []

    for (const n of notes) {
      if (n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)) {
        out.push({ kind: 'note', id: n.id, title: n.title || 'Untitled', sub: n.body.slice(0, 60), date: n.date })
      }
    }
    for (const t of transactions) {
      if (t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) {
        out.push({ kind: 'transaction', id: t.id, title: t.title, sub: `${t.category} · ${formatShortDate(t.date, language)}`, amount: fmt.format(t.amount), income: t.type === 'income' })
      }
    }
    for (const g of goals) {
      if (g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) {
        out.push({ kind: 'goal', id: g.id, title: g.title, sub: g.description || (g.completed ? 'Completed' : 'Active'), completed: g.completed })
      }
    }
    for (const h of habits) {
      if (h.title.toLowerCase().includes(q)) {
        out.push({ kind: 'habit', id: h.id, title: h.title, sub: 'Habit', color: h.color })
      }
    }
    for (const e of events) {
      if (e.title.toLowerCase().includes(q)) {
        out.push({ kind: 'event', id: e.id, title: e.title, sub: e.time ? `${formatShortDate(e.date, language)} · ${e.time}` : formatShortDate(e.date, language), date: e.date })
      }
    }

    return out
  }, [query, notes, transactions, goals, habits, events, fmt])

  const noteResults = results.filter((r) => r.kind === 'note')
  const transactionResults = results.filter((r) => r.kind === 'transaction')
  const goalResults = results.filter((r) => r.kind === 'goal')
  const habitResults = results.filter((r) => r.kind === 'habit')
  const eventResults = results.filter((r) => r.kind === 'event')

  function navigate(item: ResultItem) {
    if (item.kind === 'note') router.push('/(tabs)/notes')
    else if (item.kind === 'transaction') router.push('/(tabs)/finances')
    else if (item.kind === 'goal') router.push('/(tabs)/goals')
    else if (item.kind === 'habit') router.push('/(tabs)/habits')
    else if (item.kind === 'event') router.push('/(tabs)/calendar')
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Search bar */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
        <View style={{
          backgroundColor: theme.backgroundElement, borderRadius: 12,
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10,
        }}>
          <Text style={{ fontSize: 16, color: theme.textSecondary }}>🔍</Text>
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes, habits, events, goals..."
            placeholderTextColor={theme.textSecondary}
            style={{ flex: 1, fontSize: 15, color: theme.text, paddingVertical: 13 }}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={{ color: theme.textSecondary, fontSize: 18 }}>×</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 48 }}>
        {query.trim() === '' && (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 }}>
            Search across notes, habits, events, transactions, and goals.
          </Text>
        )}

        {query.trim() !== '' && results.length === 0 && (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 14 }}>
            No results for "{query}"
          </Text>
        )}

        {noteResults.length > 0 && (
          <ResultGroup label="Notes" theme={theme}>
            {noteResults.map((item, i) => item.kind === 'note' && (
              <ResultRow
                key={item.id}
                title={item.title}
                sub={item.sub}
                right={formatShortDate(item.date, language)}
                accent="#3b82f6"
                isLast={i === noteResults.length - 1}
                theme={theme}
                onPress={() => navigate(item)}
              />
            ))}
          </ResultGroup>
        )}

        {habitResults.length > 0 && (
          <ResultGroup label="Habits" theme={theme}>
            {habitResults.map((item, i) => item.kind === 'habit' && (
              <ResultRow
                key={item.id}
                title={item.title}
                sub=""
                right=""
                accent={item.color}
                isLast={i === habitResults.length - 1}
                theme={theme}
                onPress={() => navigate(item)}
              />
            ))}
          </ResultGroup>
        )}

        {eventResults.length > 0 && (
          <ResultGroup label="Events" theme={theme}>
            {eventResults.map((item, i) => item.kind === 'event' && (
              <ResultRow
                key={item.id}
                title={item.title}
                sub={item.sub}
                right=""
                accent="#06b6d4"
                isLast={i === eventResults.length - 1}
                theme={theme}
                onPress={() => navigate(item)}
              />
            ))}
          </ResultGroup>
        )}

        {transactionResults.length > 0 && (
          <ResultGroup label="Transactions" theme={theme}>
            {transactionResults.map((item, i) => item.kind === 'transaction' && (
              <ResultRow
                key={item.id}
                title={item.title}
                sub={item.sub}
                right={`${item.income ? '+' : '-'}${item.amount}`}
                accent={item.income ? '#22c55e' : '#ef4444'}
                isLast={i === transactionResults.length - 1}
                theme={theme}
                onPress={() => navigate(item)}
              />
            ))}
          </ResultGroup>
        )}

        {goalResults.length > 0 && (
          <ResultGroup label="Goals" theme={theme}>
            {goalResults.map((item, i) => item.kind === 'goal' && (
              <ResultRow
                key={item.id}
                title={item.title}
                sub={item.sub}
                right={item.completed ? '✓' : ''}
                accent={item.completed ? '#22c55e' : '#8b5cf6'}
                isLast={i === goalResults.length - 1}
                theme={theme}
                onPress={() => navigate(item)}
              />
            ))}
          </ResultGroup>
        )}
      </ScrollView>
    </View>
  )
}

function ResultGroup({ label, theme, children }: { label: string; theme: any; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textSecondary, marginBottom: 8, letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  )
}

function ResultRow({ title, sub, right, accent, isLast, theme, onPress }: {
  title: string; sub: string; right: string; accent: string
  isLast: boolean; theme: any; onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 16, paddingVertical: 13,
        flexDirection: 'row', alignItems: 'center',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.backgroundSelected,
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: theme.text }} numberOfLines={1}>{title}</Text>
        {sub !== '' && (
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>{sub}</Text>
        )}
      </View>
      {right !== '' && (
        <Text style={{ fontSize: 13, fontWeight: '600', color: accent, marginLeft: 12 }}>{right}</Text>
      )}
    </Pressable>
  )
}
