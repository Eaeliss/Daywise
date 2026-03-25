import { create } from 'zustand'
import { createStorage } from '@/lib/storage'

const storage = createStorage('onboarding')

type OnboardingState = {
  completed: boolean
  displayName: string
  setDisplayName: (name: string) => void
  complete: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  completed: storage.getBoolean('completed') ?? false,
  displayName: storage.getString('displayName') ?? '',

  setDisplayName: (name) => {
    storage.set('displayName', name)
    set({ displayName: name })
  },

  complete: () => {
    storage.set('completed', true)
    set({ completed: true })
  },
}))
