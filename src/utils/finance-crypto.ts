/**
 * Client-side AES-256-GCM encryption for financial data.
 * Uses the Web Crypto API (available in React Native via Hermes/JSC).
 *
 * The encryption key is derived from the user's ID using PBKDF2 + a random salt
 * stored in MMKV. This means data encrypted on one device can only be decrypted
 * by the same user (their userId is the key material), and a stolen database
 * without the salt cannot be brute-forced easily.
 *
 * Encrypted values are stored as "enc:<base64>" so legacy plaintext entries
 * can be transparently read without re-migration.
 */

import { createStorage } from '@/lib/storage'

const cryptoStorage = createStorage('finance-crypto')
const ENC_PREFIX = 'enc:'

let cachedKey: CryptoKey | null = null
let cachedUserId: string | null = null

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2)
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return arr
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function getOrCreateSalt(userId: string): Promise<Uint8Array> {
  const key = `salt_${userId}`
  const existing = cryptoStorage.getString(key)
  if (existing) return hexToBytes(existing)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  cryptoStorage.set(key, bytesToHex(salt))
  return salt
}

/** Derive or retrieve the encryption key for this user. Cached after first call. */
export async function getEncryptionKey(userId: string): Promise<CryptoKey> {
  if (cachedKey && cachedUserId === userId) return cachedKey

  const salt = await getOrCreateSalt(userId)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(userId),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  cachedKey = key
  cachedUserId = userId
  return key
}

/** Encrypts a string. Returns "enc:<base64(iv + ciphertext)>". */
export async function encryptField(value: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(value),
  )
  const combined = new Uint8Array(12 + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), 12)
  return ENC_PREFIX + btoa(String.fromCharCode(...combined))
}

/** Decrypts a value produced by encryptField. Passes through plaintext transparently. */
export async function decryptField(value: string, key: CryptoKey): Promise<string> {
  if (!value.startsWith(ENC_PREFIX)) return value // legacy plaintext
  try {
    const bytes = Uint8Array.from(atob(value.slice(ENC_PREFIX.length)), (c) => c.charCodeAt(0))
    const iv = bytes.slice(0, 12)
    const ciphertext = bytes.slice(12)
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
    return new TextDecoder().decode(plaintext)
  } catch {
    return value // return as-is if decryption fails (e.g. wrong key)
  }
}

/** Clears the cached key (call on sign-out). */
export function clearEncryptionKey() {
  cachedKey = null
  cachedUserId = null
}
