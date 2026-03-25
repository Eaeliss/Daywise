import { MMKV } from 'react-native-mmkv'

export const storage = new MMKV()

// Always use userId-prefixed keys to prevent data leakage between accounts
export const getUserStorage = (userId: string) => {
  // P-17: guard against empty userId — would create a shared unscoped namespace
  if (!userId) throw new Error('getUserStorage requires a non-empty userId')
  // P-06: colon in userId would collapse namespace boundaries (e.g. "a:b" + "c" === "a" + "b:c")
  if (userId.includes(':')) throw new Error('getUserStorage: userId must not contain ":"')

  return {
    get: (key: string) => storage.getString(`${userId}:${key}`),
    set: (key: string, value: string) => storage.set(`${userId}:${key}`, value),
    delete: (key: string) => storage.delete(`${userId}:${key}`),
  }
}
