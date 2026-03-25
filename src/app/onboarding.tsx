import { useRef, useState } from 'react'
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '@/hooks/use-theme'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { useFinancesStore } from '@/stores/finances-store'
import { useHabitsStore } from '@/stores/habits-store'
import { usePreferencesStore } from '@/stores/preferences-store'
import { requestNotificationPermission } from '@/utils/notifications'

const TOTAL_STEPS = 4

const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS', 'JPY', 'CAD', 'AUD']

export default function OnboardingScreen() {
  const theme = useTheme()
  const { setDisplayName, complete } = useOnboardingStore()
  const { setBudget, budgetMode, budgetPercent, budgetFixed } = useFinancesStore()
  const { addHabit } = useHabitsStore()
  const { setCurrency: saveCurrency } = usePreferencesStore()

  const [step, setStep] = useState(0)
  const progress = useRef(new Animated.Value(0)).current

  // Step 1 — name
  const [name, setName] = useState('')

  // Step 2 — income
  const [income, setIncome] = useState('')
  const [currency, setCurrency] = useState('USD')

  // Step 3 — first habit
  const [habit, setHabit] = useState('')

  function animateTo(next: number) {
    Animated.timing(progress, {
      toValue: next / (TOTAL_STEPS - 1),
      duration: 300,
      useNativeDriver: false,
    }).start()
    setStep(next)
  }

  function handleNext() {
    if (step === 0) {
      if (name.trim()) setDisplayName(name.trim())
      animateTo(1)
    } else if (step === 1) {
      const parsed = parseFloat(income.replace(',', '.'))
      if (!isNaN(parsed) && parsed > 0) {
        setBudget(parsed, budgetMode, budgetPercent, budgetFixed)
      }
      saveCurrency(currency)
      animateTo(2)
    } else if (step === 2) {
      if (habit.trim()) addHabit(habit.trim())
      animateTo(3)
    } else {
      requestNotificationPermission().catch(() => {})
      complete()
      router.replace('/(tabs)/dashboard')
    }
  }

  function handleSkip() {
    if (step < TOTAL_STEPS - 1) animateTo(step + 1)
    else {
      requestNotificationPermission().catch(() => {})
      complete()
      router.replace('/(tabs)/dashboard')
    }
  }

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  const canContinue =
    step === 0 ? true :          // name is optional
    step === 1 ? true :          // income is optional
    step === 2 ? true :          // habit is optional
    true

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: theme.backgroundSelected, marginTop: 56 }}>
        <Animated.View style={{ height: 3, backgroundColor: '#3b82f6', width: barWidth }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, padding: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 0 — Welcome */}
        {step === 0 && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6', marginBottom: 12, letterSpacing: 1 }}>
              WELCOME
            </Text>
            <Text style={{ fontSize: 32, fontWeight: '800', color: theme.text, marginBottom: 12, lineHeight: 40 }}>
              Your life,{'\n'}organized.
            </Text>
            <Text style={{ fontSize: 16, color: theme.textSecondary, lineHeight: 24, marginBottom: 48 }}>
              LifePlan helps you track habits, goals, finances, and more — all in one place.
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text, marginBottom: 8 }}>
              What should we call you?
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleNext}
              style={{
                backgroundColor: theme.backgroundElement,
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 16, color: theme.text,
              }}
            />
          </View>
        )}

        {/* Step 1 — Income */}
        {step === 1 && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6', marginBottom: 12, letterSpacing: 1 }}>
              FINANCES
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 12 }}>
              Set your income
            </Text>
            <Text style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 36 }}>
              This helps LifePlan calculate your budget. You can always change it later.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text, marginBottom: 8 }}>
              Monthly Income
            </Text>
            <TextInput
              value={income}
              onChangeText={setIncome}
              placeholder="e.g. 5000"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={{
                backgroundColor: theme.backgroundElement,
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 16, color: theme.text, marginBottom: 20,
              }}
            />

            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text, marginBottom: 10 }}>
              Currency
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                    backgroundColor: currency === c ? '#3b82f6' : theme.backgroundElement,
                  }}
                >
                  <Text style={{
                    fontSize: 14, fontWeight: '600',
                    color: currency === c ? '#fff' : theme.textSecondary,
                  }}>
                    {c}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Step 2 — First habit */}
        {step === 2 && (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#3b82f6', marginBottom: 12, letterSpacing: 1 }}>
              HABITS
            </Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 12 }}>
              Build a habit
            </Text>
            <Text style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 36 }}>
              Start with one small habit. You can add more any time.
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '500', color: theme.text, marginBottom: 8 }}>
              Your first habit
            </Text>
            <TextInput
              value={habit}
              onChangeText={setHabit}
              placeholder="e.g. Exercise, Read, Drink water"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="done"
              onSubmitEditing={handleNext}
              style={{
                backgroundColor: theme.backgroundElement,
                borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 16, color: theme.text,
              }}
            />
          </View>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 56, marginBottom: 24 }}>🎉</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, marginBottom: 12, textAlign: 'center' }}>
              You're all set!
            </Text>
            <Text style={{ fontSize: 15, color: theme.textSecondary, lineHeight: 22, textAlign: 'center', paddingHorizontal: 16 }}>
              Everything is ready. Start tracking your goals, habits, and finances today.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={{ padding: 24, gap: 12 }}>
        <Pressable
          onPress={handleNext}
          style={{
            backgroundColor: '#3b82f6', borderRadius: 14,
            paddingVertical: 16, alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            {step === TOTAL_STEPS - 1 ? "Let's go" : 'Continue'}
          </Text>
        </Pressable>

        {step < TOTAL_STEPS - 1 && (
          <Pressable onPress={handleSkip} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Skip</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
