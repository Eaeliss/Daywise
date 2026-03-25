import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('finances')

export type TransactionType = 'income' | 'expense'
export type BudgetMode = 'percentage' | 'fixed'
export type RecurringFrequency = 'monthly' | 'weekly'

export type Transaction = {
  id: string
  title: string
  amount: number
  type: TransactionType
  category: string
  date: string // YYYY-MM-DD
}

export type RecurringTransaction = {
  id: string
  title: string
  amount: number
  type: TransactionType
  category: string
  frequency: RecurringFrequency
  // lastApplied: 'YYYY-MM' for monthly, 'YYYY-WW' for weekly, '' if never
  lastApplied: string
}

type FinancesState = {
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
  monthlyIncome: number
  budgetMode: BudgetMode
  budgetPercent: number
  budgetFixed: number
  addTransaction: (title: string, amount: number, type: TransactionType, category: string, date: string) => void
  removeTransaction: (id: string) => void
  updateTransaction: (id: string, title: string, amount: number, type: TransactionType, category: string, date: string) => void
  addRecurring: (title: string, amount: number, type: TransactionType, category: string, frequency: RecurringFrequency) => void
  removeRecurring: (id: string) => void
  updateRecurring: (id: string, title: string, amount: number, type: TransactionType, category: string, frequency: RecurringFrequency) => void
  applyDueRecurring: () => void
  setBudget: (monthlyIncome: number, mode: BudgetMode, percent: number, fixed: number) => void
}

function loadTransactions(): Transaction[] {
  const raw = storage.getString('transactions')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return parsed.map((t: Transaction & { category?: string }) => ({
      ...t,
      category: t.category ?? 'Other',
    }))
  } catch { return [] }
}

function loadRecurring(): RecurringTransaction[] {
  const raw = storage.getString('recurring')
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function saveTransactions(transactions: Transaction[]) {
  storage.set('transactions', JSON.stringify(transactions))
}

function saveRecurring(recurring: RecurringTransaction[]) {
  storage.set('recurring', JSON.stringify(recurring))
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getWeekKey(date: Date): string {
  // ISO week: Monday-based
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}

function todayString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export const useFinancesStore = create<FinancesState>((set, get) => ({
  transactions: loadTransactions(),
  recurringTransactions: loadRecurring(),
  monthlyIncome: storage.getNumber('monthlyIncome') ?? 0,
  budgetMode: (storage.getString('budgetMode') as BudgetMode) ?? 'percentage',
  budgetPercent: storage.getNumber('budgetPercent') ?? 80,
  budgetFixed: storage.getNumber('budgetFixed') ?? 0,

  addTransaction: (title, amount, type, category, date) => {
    const transactions = [...get().transactions, { id: makeId(), title, amount, type, category, date }]
    saveTransactions(transactions)
    set({ transactions })
  },

  removeTransaction: (id) => {
    const current = get().transactions
    const transactions = current.filter((t) => t.id !== id)
    if (transactions.length === current.length) return
    saveTransactions(transactions)
    set({ transactions })
  },

  updateTransaction: (id, title, amount, type, category, date) => {
    const transactions = get().transactions.map((t) =>
      t.id === id ? { ...t, title, amount, type, category, date } : t
    )
    saveTransactions(transactions)
    set({ transactions })
  },

  addRecurring: (title, amount, type, category, frequency) => {
    const recurring = [...get().recurringTransactions, { id: makeId(), title, amount, type, category, frequency, lastApplied: '' }]
    saveRecurring(recurring)
    set({ recurringTransactions: recurring })
  },

  removeRecurring: (id) => {
    const recurring = get().recurringTransactions.filter((r) => r.id !== id)
    saveRecurring(recurring)
    set({ recurringTransactions: recurring })
  },

  updateRecurring: (id, title, amount, type, category, frequency) => {
    const recurringTransactions = get().recurringTransactions.map((r) =>
      r.id === id ? { ...r, title, amount, type, category, frequency } : r
    )
    saveRecurring(recurringTransactions)
    set({ recurringTransactions })
  },

  applyDueRecurring: () => {
    const now = new Date()
    const monthKey = getMonthKey(now)
    const weekKey = getWeekKey(now)
    const today = todayString(now)

    const { recurringTransactions, transactions } = get()
    let newTransactions = [...transactions]
    let changed = false

    const updatedRecurring = recurringTransactions.map((r) => {
      const key = r.frequency === 'monthly' ? monthKey : weekKey
      if (r.lastApplied === key) return r
      // Due — apply it
      newTransactions = [...newTransactions, { id: makeId(), title: r.title, amount: r.amount, type: r.type, category: r.category, date: today }]
      changed = true
      return { ...r, lastApplied: key }
    })

    if (!changed) return
    saveTransactions(newTransactions)
    saveRecurring(updatedRecurring)
    set({ transactions: newTransactions, recurringTransactions: updatedRecurring })
  },

  setBudget: (monthlyIncome, mode, percent, fixed) => {
    storage.set('monthlyIncome', monthlyIncome)
    storage.set('budgetMode', mode)
    storage.set('budgetPercent', percent)
    storage.set('budgetFixed', fixed)
    set({ monthlyIncome, budgetMode: mode, budgetPercent: percent, budgetFixed: fixed })
  },
}))
