import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// P-06: fail loudly at startup rather than producing a broken client
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env',
  )
}

// P-01: expo-secure-store enforces a 2048-byte limit per key on iOS.
// Supabase sessions (JWT + refresh token) routinely exceed this, causing silent
// setItem failures and logging users out on every app restart.
// Fix: chunk large values across multiple SecureStore keys and reassemble on read.
const CHUNK_SIZE = 1900 // safe margin below the 2048-byte iOS limit
const chunkCountKey = (key: string) => `${key}.chunks`
const chunkKey = (key: string, i: number) => `${key}.chunk.${i}`

const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const countStr = await SecureStore.getItemAsync(chunkCountKey(key))
    if (countStr !== null) {
      const count = parseInt(countStr, 10)
      const parts: string[] = []
      for (let i = 0; i < count; i++) {
        const part = await SecureStore.getItemAsync(chunkKey(key, i))
        if (part === null) return null
        parts.push(part)
      }
      return parts.join('')
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      // Remove any pre-existing chunks before writing as a single key
      await secureStorage.removeItem(key)
      await SecureStore.setItemAsync(key, value)
    } else {
      const chunks: string[] = []
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE))
      }
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(chunkKey(key, i), chunks[i])
      }
      await SecureStore.setItemAsync(chunkCountKey(key), String(chunks.length))
      // Remove any legacy non-chunked key so reads don't pick up stale data
      await SecureStore.deleteItemAsync(key)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    const countStr = await SecureStore.getItemAsync(chunkCountKey(key))
    if (countStr !== null) {
      const count = parseInt(countStr, 10)
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, i))
      }
      await SecureStore.deleteItemAsync(chunkCountKey(key))
    }
    await SecureStore.deleteItemAsync(key)
  },
}

// P-05: use SecureStore (encrypted + chunked) on native, safe localStorage wrapper on web
// AsyncStorage on web requires `window` which is not defined during Metro SSR evaluation
const webStorage = {
  getItem: (key: string): Promise<string | null> =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage?.getItem(key) ?? null : null),
  setItem: (key: string, value: string): Promise<void> =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage?.setItem(key, value) : undefined),
  removeItem: (key: string): Promise<void> =>
    Promise.resolve(typeof window !== 'undefined' ? window.localStorage?.removeItem(key) : undefined),
}

const authStorage = Platform.OS === 'web' ? webStorage : secureStorage

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
