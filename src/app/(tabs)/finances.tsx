import { useEffect, useMemo, useState } from 'react'
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
import { usePreferencesStore } from '@/stores/preferences-store'
import { BudgetMode, RecurringFrequency, Transaction, TransactionType, useFinancesStore } from '@/stores/finances-store'
import { SavingsGoal, useSavingsStore } from '@/stores/savings-store'
import { EmptyState } from '@/components/ui/EmptyState'
import { DateInput } from '@/components/ui/DateInput'
import { hapticLight, hapticSuccess } from '@/utils/haptics'
import { formatShortDate } from '@/utils/format'

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Housing', 'Health', 'Shopping', 'Entertainment', 'Education', 'Other']
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other']

const CATEGORY_COLOR: Record<string, string> = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Housing: '#8b5cf6',
  Health: '#ec4899',
  Shopping: '#f59e0b',
  Entertainment: '#06b6d4',
  Education: '#10b981',
  Salary: '#22c55e',
  Freelance: '#84cc16',
  Investment: '#6366f1',
  Gift: '#e879f9',
  Other: '#6b7280',
}

function categoryColor(cat: string) {
  return CATEGORY_COLOR[cat] ?? '#6b7280'
}

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}


export default function FinancesScreen() {
  const theme = useTheme()
  const currency = usePreferencesStore((s) => s.currency)
  const language = usePreferencesStore((s) => s.language)
  const { transactions, recurringTransactions, addTransaction, removeTransaction, updateTransaction, addRecurring, removeRecurring, updateRecurring, applyDueRecurring, monthlyIncome, budgetMode, budgetPercent, budgetFixed, setBudget } = useFinancesStore()

  useEffect(() => { applyDueRecurring() }, [])

  const [txRange, setTxRange] = useState<'all' | 'month'>('month')

  const [modalVisible, setModalVisible] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [category, setCategory] = useState('Other')
  const [txDate, setTxDate] = useState(getTodayString())
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>('monthly')

  // Edit transaction modal state
  const [editTxVisible, setEditTxVisible] = useState(false)
  const [editTxId, setEditTxId] = useState<string | null>(null)
  const [editTxTitle, setEditTxTitle] = useState('')
  const [editTxAmount, setEditTxAmount] = useState('')
  const [editTxType, setEditTxType] = useState<TransactionType>('expense')
  const [editTxCategory, setEditTxCategory] = useState('Other')
  const [editTxDate, setEditTxDate] = useState(getTodayString())

  function openEditTx(t: Transaction) {
    setEditTxId(t.id)
    setEditTxTitle(t.title)
    setEditTxAmount(String(t.amount))
    setEditTxType(t.type)
    setEditTxCategory(t.category)
    setEditTxDate(t.date)
    setEditTxVisible(true)
  }

  function handleSaveEditTx() {
    const parsed = parseFloat(editTxAmount.replace(',', '.'))
    if (!editTxId || !editTxTitle.trim() || isNaN(parsed) || parsed <= 0) return
    if (editTxDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(editTxDate)) return
    hapticSuccess()
    updateTransaction(editTxId, editTxTitle.trim(), parsed, editTxType, editTxCategory, editTxDate || getTodayString())
    setEditTxVisible(false)
  }

  // Edit recurring modal state
  const [editRxVisible, setEditRxVisible] = useState(false)
  const [editRxId, setEditRxId] = useState<string | null>(null)
  const [editRxTitle, setEditRxTitle] = useState('')
  const [editRxAmount, setEditRxAmount] = useState('')
  const [editRxType, setEditRxType] = useState<TransactionType>('expense')
  const [editRxCategory, setEditRxCategory] = useState('Other')
  const [editRxFreq, setEditRxFreq] = useState<RecurringFrequency>('monthly')

  function openEditRx(r: { id: string; title: string; amount: number; type: TransactionType; category: string; frequency: RecurringFrequency }) {
    setEditRxId(r.id)
    setEditRxTitle(r.title)
    setEditRxAmount(String(r.amount))
    setEditRxType(r.type)
    setEditRxCategory(r.category)
    setEditRxFreq(r.frequency)
    setEditRxVisible(true)
  }

  function handleSaveEditRx() {
    const parsed = parseFloat(editRxAmount.replace(',', '.'))
    if (!editRxId || !editRxTitle.trim() || isNaN(parsed) || parsed <= 0) return
    hapticSuccess()
    updateRecurring(editRxId, editRxTitle.trim(), parsed, editRxType, editRxCategory, editRxFreq)
    setEditRxVisible(false)
  }

  function handleExportCSV() {
    const header = 'Date,Title,Type,Category,Amount\n'
    const rows = [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((t) => `${t.date},"${t.title}",${t.type},${t.category},${t.amount}`)
      .join('\n')
    Share.share({ message: header + rows, title: 'Transactions Export' })
  }

  const { goals: savingsGoals, addGoal: addSavingsGoal, updateGoal: updateSavingsGoal, removeGoal: removeSavingsGoal, setSaved } = useSavingsStore()

  // Savings modal state
  const [savingsModalVisible, setSavingsModalVisible] = useState(false)
  const [savingsMode, setSavingsMode] = useState<'add' | 'update' | 'edit'>('add')
  const [updateGoalId, setUpdateGoalId] = useState<string | null>(null)
  const [savingsTitle, setSavingsTitle] = useState('')
  const [savingsTarget, setSavingsTarget] = useState('')
  const [savingsDeadline, setSavingsDeadline] = useState('')
  const [savedAmountInput, setSavedAmountInput] = useState('')

  function openAddSavings() {
    setSavingsMode('add')
    setSavingsTitle('')
    setSavingsTarget('')
    setSavingsDeadline('')
    setSavingsModalVisible(true)
  }

  function openUpdateSaved(goal: SavingsGoal) {
    setSavingsMode('update')
    setUpdateGoalId(goal.id)
    setSavedAmountInput(goal.savedAmount > 0 ? String(goal.savedAmount) : '')
    setSavingsModalVisible(true)
  }

  function openEditGoal(goal: SavingsGoal) {
    setSavingsMode('edit')
    setUpdateGoalId(goal.id)
    setSavingsTitle(goal.title)
    setSavingsTarget(String(goal.targetAmount))
    setSavingsDeadline(goal.deadline)
    setSavingsModalVisible(true)
  }

  function handleSaveSavings() {
    if (savingsMode === 'add') {
      const target = parseFloat(savingsTarget.replace(',', '.'))
      if (!savingsTitle.trim() || isNaN(target) || target <= 0) return
      const deadline = savingsDeadline.trim()
      if (deadline !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return
      addSavingsGoal(savingsTitle.trim(), target, deadline)
    } else if (savingsMode === 'edit') {
      const target = parseFloat(savingsTarget.replace(',', '.'))
      if (!updateGoalId || !savingsTitle.trim() || isNaN(target) || target <= 0) return
      const deadline = savingsDeadline.trim()
      if (deadline !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return
      updateSavingsGoal(updateGoalId, savingsTitle.trim(), target, deadline)
    } else {
      const amt = parseFloat(savedAmountInput.replace(',', '.'))
      if (!updateGoalId || isNaN(amt) || amt < 0) return
      setSaved(updateGoalId, amt)
    }
    setSavingsModalVisible(false)
  }

  // Budget modal state
  const [budgetModalVisible, setBudgetModalVisible] = useState(false)
  const [draftIncome, setDraftIncome] = useState('')
  const [draftMode, setDraftMode] = useState<BudgetMode>('percentage')
  const [draftPercent, setDraftPercent] = useState('')
  const [draftFixed, setDraftFixed] = useState('')

  function openBudgetModal() {
    setDraftIncome(monthlyIncome > 0 ? String(monthlyIncome) : '')
    setDraftMode(budgetMode)
    setDraftPercent(budgetPercent > 0 ? String(budgetPercent) : '')
    setDraftFixed(budgetFixed > 0 ? String(budgetFixed) : '')
    setBudgetModalVisible(true)
  }

  function handleSaveBudget() {
    const income = parseFloat(draftIncome.replace(',', '.'))
    const percent = parseFloat(draftPercent.replace(',', '.'))
    const fixed = parseFloat(draftFixed.replace(',', '.'))
    if (isNaN(income) || income < 0) return
    if (draftMode === 'percentage' && (isNaN(percent) || percent <= 0 || percent > 100)) return
    if (draftMode === 'fixed' && (isNaN(fixed) || fixed <= 0)) return
    setBudget(income, draftMode, isNaN(percent) ? 0 : percent, isNaN(fixed) ? 0 : fixed)
    setBudgetModalVisible(false)
  }

  const fmt = useMemo(
    () => new Intl.NumberFormat(language, { style: 'currency', currency }),
    [currency, language],
  )

  const effectiveBudget = useMemo(() => {
    if (monthlyIncome <= 0) return 0
    if (budgetMode === 'percentage') return (monthlyIncome * budgetPercent) / 100
    return budgetFixed
  }, [monthlyIncome, budgetMode, budgetPercent, budgetFixed])

  const monthPrefix = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const visibleTransactions = useMemo(
    () => txRange === 'month' ? transactions.filter((t) => t.date.startsWith(monthPrefix)) : transactions,
    [transactions, txRange, monthPrefix],
  )

  const { balance, totalIncome, totalExpenses, sorted, categoryBreakdown } = useMemo(() => {
    let income = 0
    let expenses = 0
    const catMap: Record<string, number> = {}

    for (const t of visibleTransactions) {
      if (t.type === 'income') {
        income += t.amount
      } else {
        expenses += t.amount
        catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
      }
    }

    const categoryBreakdown = Object.entries(catMap)
      .map(([cat, total]) => ({ cat, total, pct: expenses > 0 ? total / expenses : 0 }))
      .sort((a, b) => b.total - a.total)

    const sorted = [...visibleTransactions].sort((a, b) => b.date.localeCompare(a.date))
    return { balance: income - expenses, totalIncome: income, totalExpenses: expenses, sorted, categoryBreakdown }
  }, [visibleTransactions])

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleTypeChange(t: TransactionType) {
    setType(t)
    setCategory(t === 'income' ? 'Salary' : 'Other')
  }

  function handleAdd() {
    const parsed = parseFloat(amount.replace(',', '.'))
    if (!title.trim() || isNaN(parsed) || parsed <= 0) return
    if (!isRecurring && txDate !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(txDate)) return
    hapticSuccess()
    if (isRecurring) {
      addRecurring(title.trim(), parsed, type, category, recurringFreq)
    } else {
      addTransaction(title.trim(), parsed, type, category, txDate || getTodayString())
    }
    setTitle('')
    setAmount('')
    setType('expense')
    setCategory('Other')
    setTxDate(getTodayString())
    setIsRecurring(false)
    setRecurringFreq('monthly')
    setModalVisible(false)
  }

  const balanceColor = balance >= 0 ? '#22c55e' : '#ef4444'

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Range toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 3, margin: 20, marginBottom: 0 }}>
          {(['month', 'all'] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setTxRange(r)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: txRange === r ? theme.background : 'transparent' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: txRange === r ? '#3b82f6' : theme.textSecondary }}>
                {r === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Summary card */}
        <View style={{
          margin: 20, padding: 20,
          backgroundColor: theme.backgroundElement,
          borderRadius: 16,
        }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginBottom: 6 }}>
            Balance
          </Text>
          <Text style={{ fontSize: 32, fontWeight: '700', color: balanceColor, marginBottom: 20 }}>
            {fmt.format(balance)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>Income</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#22c55e' }}>
                +{fmt.format(totalIncome)}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: theme.backgroundSelected }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 2 }}>Expenses</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#ef4444' }}>
                -{fmt.format(totalExpenses)}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget card */}
        <View style={{ marginHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            backgroundColor: theme.backgroundElement,
            borderRadius: 16, padding: 20,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: effectiveBudget > 0 ? 14 : 0 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Budget</Text>
              <Pressable onPress={openBudgetModal} hitSlop={8}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#3b82f6' }}>
                  {effectiveBudget > 0 ? 'Edit' : 'Set up'}
                </Text>
              </Pressable>
            </View>

            {effectiveBudget > 0 ? (() => {
              const spent = totalExpenses
              const remaining = effectiveBudget - spent
              const pct = Math.min(spent / effectiveBudget, 1)
              const overBudget = spent > effectiveBudget
              const barColor = overBudget ? '#ef4444' : pct > 0.8 ? '#f59e0b' : '#22c55e'
              const label = budgetMode === 'percentage'
                ? `${budgetPercent}% of ${fmt.format(monthlyIncome)}`
                : 'Fixed budget'
              return (
                <View>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 10 }}>{label}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>Spent</Text>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>{fmt.format(spent)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>{overBudget ? 'Over by' : 'Remaining'}</Text>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: overBudget ? '#ef4444' : '#22c55e' }}>
                        {fmt.format(Math.abs(remaining))}
                      </Text>
                    </View>
                  </View>
                  <View style={{ height: 6, backgroundColor: theme.backgroundSelected, borderRadius: 3 }}>
                    <View style={{
                      height: 6, borderRadius: 3,
                      backgroundColor: barColor,
                      width: `${Math.round(pct * 100)}%`,
                    }} />
                  </View>
                  <Text style={{ fontSize: 11, color: theme.textSecondary, marginTop: 6, textAlign: 'right' }}>
                    {fmt.format(spent)} / {fmt.format(effectiveBudget)}
                  </Text>
                </View>
              )
            })() : (
              <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                Set a budget based on your income or a fixed amount.
              </Text>
            )}
          </View>
        </View>

        {/* Recurring transactions */}
        {recurringTransactions.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
              Recurring
            </Text>
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
              {recurringTransactions.map((r, i) => (
                <View
                  key={r.id}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    borderBottomWidth: i < recurringTransactions.length - 1 ? 1 : 0,
                    borderBottomColor: theme.backgroundSelected,
                  }}
                >
                  <Pressable
                    onPress={() => openEditRx(r)}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 13, paddingRight: 0,
                    }}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: categoryColor(r.category), marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: theme.text }}>{r.title}</Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                        {r.category} · {r.frequency === 'monthly' ? 'Every month' : 'Every week'}
                      </Text>
                    </View>
                    <Text style={{
                      fontSize: 15, fontWeight: '600', marginRight: 12,
                      color: r.type === 'income' ? '#22c55e' : '#ef4444',
                    }}>
                      {r.type === 'income' ? '+' : '-'}{fmt.format(r.amount)}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => removeRecurring(r.id)} hitSlop={8} style={{ paddingHorizontal: 16, paddingVertical: 13 }}>
                    <Text style={{ color: theme.textSecondary, fontSize: 20, lineHeight: 22 }}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Savings goals */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Savings Goals</Text>
            <Pressable onPress={openAddSavings} hitSlop={8}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#3b82f6' }}>+ Add</Text>
            </Pressable>
          </View>
          {savingsGoals.length === 0 ? (
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, padding: 16 }}>
              <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 14 }}>
                No savings goals yet. Tap + Add to create one.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {savingsGoals.map((g) => (
                <SavingsGoalCard
                  key={g.id}
                  goal={g}
                  fmt={fmt}
                  theme={theme}
                  locale={language}
                  onUpdateSaved={() => openUpdateSaved(g)}
                  onEdit={() => openEditGoal(g)}
                  onRemove={() => removeSavingsGoal(g.id)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
              Expenses by category
            </Text>
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, padding: 16, gap: 14 }}>
              {categoryBreakdown.map(({ cat, total, pct }) => (
                <View key={cat}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: categoryColor(cat) }} />
                      <Text style={{ fontSize: 14, color: theme.text }}>{cat}</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: theme.textSecondary }}>{fmt.format(total)}</Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: theme.backgroundSelected, borderRadius: 2 }}>
                    <View style={{
                      height: 4, borderRadius: 2,
                      backgroundColor: categoryColor(cat),
                      width: `${Math.round(pct * 100)}%`,
                    }} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Transactions list */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.text }}>Transactions</Text>
          {transactions.length > 0 && (
            <Pressable onPress={handleExportCSV} hitSlop={8}>
              <Text style={{ fontSize: 13, fontWeight: '500', color: '#3b82f6' }}>Export CSV</Text>
            </Pressable>
          )}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {sorted.length === 0 ? (
            <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 24, fontSize: 14 }}>
              No transactions yet
            </Text>
          ) : (
            <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, overflow: 'hidden' }}>
              {sorted.map((t, i) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  isLast={i === sorted.length - 1}
                  formatted={fmt.format(t.amount)}
                  separatorColor={theme.backgroundSelected}
                  textColor={theme.text}
                  secondaryColor={theme.textSecondary}
                  locale={language}
                  onRemove={removeTransaction}
                  onEdit={openEditTx}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => { setTxDate(getTodayString()); setModalVisible(true) }}
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

      {/* Savings modal */}
      <Modal
        visible={savingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSavingsModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setSavingsModalVisible(false)}
        >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View
              onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()}
              style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}
            >
              {savingsMode === 'update' ? (
                <>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 4 }}>Update Saved Amount</Text>
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
                    Enter the total you have saved so far.
                  </Text>
                  <TextInput
                    autoFocus
                    value={savedAmountInput}
                    onChangeText={setSavedAmountInput}
                    placeholder="e.g. 450"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveSavings}
                    style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 16 }}
                  />
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 20 }}>
                    {savingsMode === 'edit' ? 'Edit Savings Goal' : 'New Savings Goal'}
                  </Text>
                  <TextInput
                    autoFocus
                    value={savingsTitle}
                    onChangeText={setSavingsTitle}
                    placeholder="Goal name (e.g. Vacation)"
                    placeholderTextColor={theme.textSecondary}
                    style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10 }}
                  />
                  <TextInput
                    value={savingsTarget}
                    onChangeText={setSavingsTarget}
                    placeholder="Target amount"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10 }}
                  />
                  <View style={{ marginBottom: 16 }}>
                    <DateInput value={savingsDeadline} onChange={setSavingsDeadline} placeholder="Deadline (optional)" />
                  </View>
                </>
              )}
              <Pressable
                onPress={handleSaveSavings}
                style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                  {savingsMode === 'add' ? 'Create Goal' : savingsMode === 'edit' ? 'Save Changes' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Budget setup modal */}
      <Modal
        visible={budgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBudgetModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setBudgetModalVisible(false)}
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
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 20 }}>
                Budget Setup
              </Text>

              <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginBottom: 6 }}>
                Monthly Income
              </Text>
              <TextInput
                value={draftIncome}
                onChangeText={setDraftIncome}
                placeholder="e.g. 5000"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 20,
                }}
              />

              <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginBottom: 10 }}>
                Budget Type
              </Text>
              <View style={{
                flexDirection: 'row', backgroundColor: theme.backgroundElement,
                borderRadius: 10, padding: 3, marginBottom: 20,
              }}>
                {(['percentage', 'fixed'] as BudgetMode[]).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setDraftMode(m)}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                      backgroundColor: draftMode === m ? theme.background : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 14, fontWeight: '600',
                      color: draftMode === m ? '#3b82f6' : theme.textSecondary,
                    }}>
                      {m === 'percentage' ? '% of Income' : 'Fixed Amount'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {draftMode === 'percentage' ? (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginBottom: 6 }}>
                    Percentage (1–100)
                  </Text>
                  <TextInput
                    value={draftPercent}
                    onChangeText={setDraftPercent}
                    placeholder="e.g. 80"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={{
                      backgroundColor: theme.backgroundElement,
                      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                      fontSize: 15, color: theme.text, marginBottom: 8,
                    }}
                  />
                  {draftPercent && draftIncome && !isNaN(parseFloat(draftPercent)) && !isNaN(parseFloat(draftIncome)) && (
                    <Text style={{ fontSize: 13, color: '#3b82f6', marginBottom: 16 }}>
                      = {fmt.format((parseFloat(draftIncome) * parseFloat(draftPercent)) / 100)} / month
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: theme.textSecondary, marginBottom: 6 }}>
                    Budget Amount
                  </Text>
                  <TextInput
                    value={draftFixed}
                    onChangeText={setDraftFixed}
                    placeholder="e.g. 2000"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={{
                      backgroundColor: theme.backgroundElement,
                      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                      fontSize: 15, color: theme.text, marginBottom: 16,
                    }}
                  />
                </>
              )}

              <Pressable
                onPress={handleSaveBudget}
                style={{
                  backgroundColor: '#3b82f6', borderRadius: 10,
                  paddingVertical: 14, alignItems: 'center', marginTop: 4,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save Budget</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit transaction modal */}
      <Modal visible={editTxVisible} transparent animationType="fade" onRequestClose={() => setEditTxVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setEditTxVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()} style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Edit Transaction</Text>
              <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 3, marginBottom: 16 }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <Pressable key={t} onPress={() => { setEditTxType(t); setEditTxCategory(t === 'income' ? 'Salary' : 'Other') }}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: editTxType === t ? theme.background : 'transparent' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: editTxType === t ? (t === 'income' ? '#22c55e' : '#ef4444') : theme.textSecondary }}>
                      {t === 'income' ? 'Income' : 'Expense'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                {(editTxType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <Pressable key={cat} onPress={() => setEditTxCategory(cat)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: editTxCategory === cat ? categoryColor(cat) : theme.backgroundElement }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: editTxCategory === cat ? '#fff' : theme.textSecondary }}>{cat}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput autoFocus value={editTxTitle} onChangeText={setEditTxTitle} placeholder="Title" placeholderTextColor={theme.textSecondary}
                style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10 }} />
              <TextInput value={editTxAmount} onChangeText={setEditTxAmount} placeholder="Amount" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad"
                style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 12 }} />
              <View style={{ marginBottom: 16 }}>
                <DateInput value={editTxDate} onChange={setEditTxDate} placeholder="Date" />
              </View>
              <Pressable onPress={handleSaveEditTx} style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save Changes</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Edit recurring modal */}
      <Modal visible={editRxVisible} transparent animationType="fade" onRequestClose={() => setEditRxVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={() => setEditRxVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View onStartShouldSetResponder={() => true} onClick={(e: any) => e.stopPropagation()} style={{ backgroundColor: theme.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: theme.text, marginBottom: 16 }}>Edit Recurring</Text>
              <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 3, marginBottom: 16 }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <Pressable key={t} onPress={() => { setEditRxType(t); setEditRxCategory(t === 'income' ? 'Salary' : 'Other') }}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: editRxType === t ? theme.background : 'transparent' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: editRxType === t ? (t === 'income' ? '#22c55e' : '#ef4444') : theme.textSecondary }}>
                      {t === 'income' ? 'Income' : 'Expense'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
                {(editRxType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                  <Pressable key={cat} onPress={() => setEditRxCategory(cat)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: editRxCategory === cat ? categoryColor(cat) : theme.backgroundElement }}>
                    <Text style={{ fontSize: 13, fontWeight: '500', color: editRxCategory === cat ? '#fff' : theme.textSecondary }}>{cat}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <TextInput autoFocus value={editRxTitle} onChangeText={setEditRxTitle} placeholder="Title" placeholderTextColor={theme.textSecondary}
                style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 10 }} />
              <TextInput value={editRxAmount} onChangeText={setEditRxAmount} placeholder="Amount" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad"
                style={{ backgroundColor: theme.backgroundElement, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: theme.text, marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', backgroundColor: theme.backgroundElement, borderRadius: 10, padding: 3, marginBottom: 16 }}>
                {(['monthly', 'weekly'] as RecurringFrequency[]).map((f) => (
                  <Pressable key={f} onPress={() => setEditRxFreq(f)}
                    style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: editRxFreq === f ? theme.background : 'transparent' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: editRxFreq === f ? '#3b82f6' : theme.textSecondary }}>
                      {f === 'monthly' ? 'Monthly' : 'Weekly'}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={handleSaveEditRx} style={{ backgroundColor: '#3b82f6', borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Save Changes</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Add transaction modal */}
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
                New Transaction
              </Text>

              {/* Type toggle */}
              <View style={{
                flexDirection: 'row', backgroundColor: theme.backgroundElement,
                borderRadius: 10, padding: 3, marginBottom: 16,
              }}>
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => handleTypeChange(t)}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                      backgroundColor: type === t ? theme.background : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 14, fontWeight: '600',
                      color: type === t
                        ? (t === 'income' ? '#22c55e' : '#ef4444')
                        : theme.textSecondary,
                    }}>
                      {t === 'income' ? 'Income' : 'Expense'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Category chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 16 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: category === cat ? categoryColor(cat) : theme.backgroundElement,
                    }}
                  >
                    <Text style={{
                      fontSize: 13, fontWeight: '500',
                      color: category === cat ? '#fff' : theme.textSecondary,
                    }}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <TextInput
                autoFocus
                value={title}
                onChangeText={setTitle}
                placeholder="Title"
                placeholderTextColor={theme.textSecondary}
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 10,
                }}
              />
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
                style={{
                  backgroundColor: theme.backgroundElement,
                  borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
                  fontSize: 15, color: theme.text, marginBottom: 12,
                }}
              />

              {/* Date picker — hidden when recurring (recurring has no single date) */}
              {!isRecurring && (
                <View style={{ marginBottom: 12 }}>
                  <DateInput value={txDate} onChange={setTxDate} placeholder="Date" />
                </View>
              )}

              {/* Recurring toggle */}
              <Pressable
                onPress={() => setIsRecurring((v) => !v)}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: theme.backgroundElement, borderRadius: 10,
                  paddingHorizontal: 14, paddingVertical: 12, marginBottom: isRecurring ? 10 : 16,
                }}
              >
                <Text style={{ fontSize: 15, color: theme.text }}>Recurring</Text>
                <View style={{
                  width: 42, height: 24, borderRadius: 12,
                  backgroundColor: isRecurring ? '#3b82f6' : theme.backgroundSelected,
                  justifyContent: 'center', paddingHorizontal: 2,
                }}>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
                    alignSelf: isRecurring ? 'flex-end' : 'flex-start',
                  }} />
                </View>
              </Pressable>

              {isRecurring && (
                <View style={{
                  flexDirection: 'row', backgroundColor: theme.backgroundElement,
                  borderRadius: 10, padding: 3, marginBottom: 16,
                }}>
                  {(['monthly', 'weekly'] as RecurringFrequency[]).map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => setRecurringFreq(f)}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
                        backgroundColor: recurringFreq === f ? theme.background : 'transparent',
                      }}
                    >
                      <Text style={{
                        fontSize: 14, fontWeight: '600',
                        color: recurringFreq === f ? '#3b82f6' : theme.textSecondary,
                      }}>
                        {f === 'monthly' ? 'Monthly' : 'Weekly'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <Pressable
                onPress={handleAdd}
                style={{
                  backgroundColor: '#3b82f6', borderRadius: 10,
                  paddingVertical: 14, alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>Add</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  )
}

type SavingsCardProps = {
  goal: SavingsGoal
  fmt: Intl.NumberFormat
  locale: string
  theme: ReturnType<typeof import('@/hooks/use-theme').useTheme>
  onUpdateSaved: () => void
  onEdit: () => void
  onRemove: () => void
}

function SavingsGoalCard({ goal, fmt, locale, theme, onUpdateSaved, onEdit, onRemove }: SavingsCardProps) {
  const pct = goal.targetAmount > 0 ? Math.min(goal.savedAmount / goal.targetAmount, 1) : 0
  const done = goal.savedAmount >= goal.targetAmount

  return (
    <View style={{ backgroundColor: theme.backgroundElement, borderRadius: 12, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>{goal.title}</Text>
          {goal.deadline !== '' && (
            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
              By {formatShortDate(goal.deadline, locale)}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '500' }}>Edit</Text>
          </Pressable>
          <Pressable onPress={onRemove} hitSlop={8}>
            <Text style={{ color: theme.textSecondary, fontSize: 20, lineHeight: 22 }}>×</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: 6, backgroundColor: theme.backgroundSelected, borderRadius: 3, marginBottom: 8 }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: done ? '#22c55e' : goal.color, width: `${Math.round(pct * 100)}%` }} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 13, color: theme.textSecondary }}>
          {fmt.format(goal.savedAmount)} / {fmt.format(goal.targetAmount)}
          {'  ·  '}{Math.round(pct * 100)}%
        </Text>
        <Pressable
          onPress={onUpdateSaved}
          style={{ backgroundColor: done ? theme.backgroundSelected : goal.color, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: done ? theme.textSecondary : '#fff', fontSize: 13, fontWeight: '600' }}>Update</Text>
        </Pressable>
      </View>
    </View>
  )
}

type RowProps = {
  transaction: Transaction
  isLast: boolean
  formatted: string
  separatorColor: string
  textColor: string
  secondaryColor: string
  locale: string
  onRemove: (id: string) => void
  onEdit: (t: Transaction) => void
}

function TransactionRow({ transaction, isLast, formatted, separatorColor, textColor, secondaryColor, locale, onRemove, onEdit }: RowProps) {
  const amountColor = transaction.type === 'income' ? '#22c55e' : '#ef4444'
  const sign = transaction.type === 'income' ? '+' : '-'

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: separatorColor,
    }}>
      <Pressable
        onPress={() => onEdit(transaction)}
        style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 13, paddingRight: 0,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 12 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: categoryColor(transaction.category) }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, color: textColor }}>{transaction.title}</Text>
            <Text style={{ fontSize: 12, color: secondaryColor, marginTop: 2 }}>
              {transaction.category} · {formatShortDate(transaction.date, locale)}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '600', color: amountColor, marginRight: 12 }}>
          {sign}{formatted}
        </Text>
      </Pressable>
      <Pressable onPress={() => onRemove(transaction.id)} hitSlop={8} style={{ paddingHorizontal: 16, paddingVertical: 13 }}>
        <Text style={{ color: secondaryColor, fontSize: 20, lineHeight: 22 }}>×</Text>
      </Pressable>
    </View>
  )
}
