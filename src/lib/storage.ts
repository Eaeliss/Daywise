import { Platform } from 'react-native'

// Web fallback: mirrors the MMKV API used across stores
const safeLocalStorage = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function'
  ? localStorage
  : null

class WebStorage {
  private prefix: string
  constructor(id: string) { this.prefix = `${id}:` }
  private key(k: string) { return this.prefix + k }
  getString(key: string): string | undefined { return safeLocalStorage?.getItem(this.key(key)) ?? undefined }
  getNumber(key: string): number | undefined { const v = safeLocalStorage?.getItem(this.key(key)) ?? null; return v !== null ? parseFloat(v) : undefined }
  getBoolean(key: string): boolean | undefined { const v = safeLocalStorage?.getItem(this.key(key)) ?? null; return v !== null ? v === 'true' : undefined }
  set(key: string, value: string | number | boolean): void { safeLocalStorage?.setItem(this.key(key), String(value)) }
  delete(key: string): void { safeLocalStorage?.removeItem(this.key(key)) }
}

export function createStorage(id: string): {
  getString(key: string): string | undefined
  getNumber(key: string): number | undefined
  getBoolean(key: string): boolean | undefined
  set(key: string, value: string | number | boolean): void
  delete(key: string): void
} {
  if (Platform.OS === 'web') return new WebStorage(id)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv')
    if (typeof MMKV === 'function') return new MMKV({ id })
  } catch {}
  // Fallback: in-memory store (data lost on restart, but app remains functional)
  const mem = new Map<string, string>()
  return {
    getString: (k) => mem.get(`${id}:${k}`),
    getNumber: (k) => { const v = mem.get(`${id}:${k}`); return v !== undefined ? parseFloat(v) : undefined },
    getBoolean: (k) => { const v = mem.get(`${id}:${k}`); return v !== undefined ? v === 'true' : undefined },
    set: (k, v) => { mem.set(`${id}:${k}`, String(v)) },
    delete: (k) => { mem.delete(`${id}:${k}`) },
  }
}
