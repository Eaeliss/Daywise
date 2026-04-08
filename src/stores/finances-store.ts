import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { getEncryptionKey, encryptField, decryptField, clearEncryptionKey } from '@/utils/finance-crypto'

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
  lastApplied: string
}

type FinancesState = {
  transactions: Transaction[]
  recurringTransactions: RecurringTransaction[]
  monthlyIncome: number
  budgetMode: BudgetMode
  budgetPercent: number
  budgetFixed: number
  userId: string | null
  encryptionKey: CryptoKey | null
  init: (userId: string) => Promise<void>
  addTransaction: (title: string, amount: number, type: TransactionType, category: string, date: string) => void
  removeTransaction: (id: string) => void
  updateTransaction: (id: string, title: string, amount: number, type: TransactionType, category: string, date: string) => void
  addRecurring: (title: string, amount: number, type: TransactionType, category: string, frequency: RecurringFrequency) => void
  removeRecurring: (id: string) => void
  updateRecurring: (id: string, title: string, amount: number, type: TransactionType, category: string, frequency: RecurringFrequency) => void
  applyDueRecurring: () => void
  setBudget: (monthlyIncome: number, mode: BudgetMode, percent: number, fixed: number) => void
  signOut: () => void
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getWeekKey(date: Date): string {
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

export const useFinancesStore = create<FinancesState>((set, get) => ({
  transactions: [],
  recurringTransactions: [],
  monthlyIncome: 0,
  budgetMode: 'percentage',
  budgetPercent: 80,
  budgetFixed: 0,
  userId: null,
  encryptionKey: null,

  init: async (userId) => {
    set({ userId })

    // Derive encryption key for this user
    let encKey: CryptoKey | null = null
    try {
      encKey = await getEncryptionKey(userId)
      set({ encryptionKey: encKey })
    } catch {
      // Crypto not available — proceed without encryption
    }

    const [txRes, rxRes, budgetRes] = await Promise.all([
      supabase.from('transactions').select('*').eq('user_id', userId),
      supabase.from('recurring_transactions').select('*').eq('user_id', userId),
      supabase.from('budget_settings').select('*').eq('user_id', userId).maybeSingle(),
    ])

    // Decrypt titles if encryption key is available
    const decryptTitle = async (raw: string): Promise<string> => {
      if (!encKey) return raw
      return decryptField(raw, encKey)
    }

    const transactions: Transaction[] = await Promise.all(
      (txRes.data ?? []).map(async (t) => ({
        id: t.id,
        title: await decryptTitle(t.title),
        amount: t.amount,
        type: t.type as TransactionType,
        category: t.category ?? 'Other',
        date: t.date,
      })),
    )

    const recurringTransactions: RecurringTransaction[] = await Promise.all(
      (rxRes.data ?? []).map(async (r) => ({
        id: r.id,
        title: await decryptTitle(r.title),
        amount: r.amount,
        type: r.type as TransactionType,
        category: r.category ?? 'Other',
        frequency: r.frequency as RecurringFrequency,
        lastApplied: r.last_applied ?? '',
      })),
    )

    const budget = budgetRes.data
    set({
      transactions,
      recurringTransactions,
      ...(budget ? {
        monthlyIncome: budget.monthly_income ?? 0,
        budgetMode: (budget.budget_mode as BudgetMode) ?? 'percentage',
        budgetPercent: budget.budget_percent ?? 80,
        budgetFixed: budget.budget_fixed ?? 0,
      } : {}),
    })
  },

  addTransaction: (title, amount, type, category, date) => {
    const { userId, encryptionKey } = get()
    const id = makeId()
    // Optimistic update with plaintext
    set({ transactions: [...get().transactions, { id, title, amount, type, category, date }] })
    if (userId) {
      const insert = async () => {
        const encTitle = encryptionKey ? await encryptField(title, encryptionKey) : title
        supabase.from('transactions').insert({ id, user_id: userId, title: encTitle, amount, type, category, date }).then()
      }
      insert()
    }
  },

  removeTransaction: (id) => {
    const { userId } = get()
    set({ transactions: get().transactions.filter((t) => t.id !== id) })
    if (userId) supabase.from('transactions').delete().eq('id', id).then()
  },

  updateTransaction: (id, title, amount, type, category, date) => {
    const { userId, encryptionKey } = get()
    set({ transactions: get().transactions.map((t) => t.id === id ? { ...t, title, amount, type, category, date } : t) })
    if (userId) {
      const update = async () => {
        const encTitle = encryptionKey ? await encryptField(title, encryptionKey) : title
        supabase.from('transactions').update({ title: encTitle, amount, type, category, date }).eq('id', id).then()
      }
      update()
    }
  },

  addRecurring: (title, amount, type, category, frequency) => {
    const { userId, encryptionKey } = get()
    const id = makeId()
    const r: RecurringTransaction = { id, title, amount, type, category, frequency, lastApplied: '' }
    set({ recurringTransactions: [...get().recurringTransactions, r] })
    if (userId) {
      const insert = async () => {
        const encTitle = encryptionKey ? await encryptField(title, encryptionKey) : title
        supabase.from('recurring_transactions').insert({
          id, user_id: userId, title: encTitle, amount, type, category, frequency, last_applied: '',
        }).then()
      }
      insert()
    }
  },

  removeRecurring: (id) => {
    const { userId } = get()
    set({ recurringTransactions: get().recurringTransactions.filter((r) => r.id !== id) })
    if (userId) supabase.from('recurring_transactions').delete().eq('id', id).then()
  },

  updateRecurring: (id, title, amount, type, category, frequency) => {
    const { userId, encryptionKey } = get()
    set({
      recurringTransactions: get().recurringTransactions.map((r) =>
        r.id === id ? { ...r, title, amount, type, category, frequency } : r
      ),
    })
    if (userId) {
      const update = async () => {
        const encTitle = encryptionKey ? await encryptField(title, encryptionKey) : title
        supabase.from('recurring_transactions').update({ title: encTitle, amount, type, category, frequency }).eq('id', id).then()
      }
      update()
    }
  },

  applyDueRecurring: () => {
    const { userId, encryptionKey } = get()
    const now = new Date()
    const monthKey = getMonthKey(now)
    const weekKey = getWeekKey(now)
    const today = todayString(now)

    const { recurringTransactions, transactions } = get()
    let newTransactions = [...transactions]
    const toInsert: Transaction[] = []
    let changed = false

    const updatedRecurring = recurringTransactions.map((r) => {
      const key = r.frequency === 'monthly' ? monthKey : weekKey
      if (r.lastApplied === key) return r
      const id = makeId()
      const tx: Transaction = { id, title: r.title, amount: r.amount, type: r.type, category: r.category, date: today }
      newTransactions = [...newTransactions, tx]
      toInsert.push(tx)
      changed = true
      return { ...r, lastApplied: key }
    })

    if (!changed) return
    set({ transactions: newTransactions, recurringTransactions: updatedRecurring })

    if (userId) {
      const insertAll = async () => {
        if (toInsert.length > 0) {
          const encRows = await Promise.all(
            toInsert.map(async (t) => ({
              ...t,
              user_id: userId,
              title: encryptionKey ? await encryptField(t.title, encryptionKey) : t.title,
            })),
          )
          supabase.from('transactions').insert(encRows).then()
        }
        for (const r of updatedRecurring) {
          const orig = recurringTransactions.find((o) => o.id === r.id)
          if (orig && orig.lastApplied !== r.lastApplied) {
            supabase.from('recurring_transactions').update({ last_applied: r.lastApplied }).eq('id', r.id).then()
          }
        }
      }
      insertAll()
    }
  },

  setBudget: (monthlyIncome, mode, percent, fixed) => {
    const { userId } = get()
    set({ monthlyIncome, budgetMode: mode, budgetPercent: percent, budgetFixed: fixed })
    if (userId) {
      supabase.from('budget_settings').upsert({
        user_id: userId,
        monthly_income: monthlyIncome,
        budget_mode: mode,
        budget_percent: percent,
        budget_fixed: fixed,
      }).then()
    }
  },

  signOut: () => {
    clearEncryptionKey()
    set({ transactions: [], recurringTransactions: [], userId: null, encryptionKey: null })
  },
}))
