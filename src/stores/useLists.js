import { create } from 'zustand'
import { mockWhitelist } from '@/mocks/whitelist'
import { mockBlacklist } from '@/mocks/blacklist'
import { useToasts } from '@/stores/useToasts'

// Shared debounced "saved" toast reused from useGrowthConfig's pattern.
// Kept local so this store stays standalone.
let toastTimer = null
function announceSaved() {
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    useToasts.getState().addToast({
      message: 'Settings saved.',
      tone: 'success',
    })
    toastTimer = null
  }, 1500)
}

function normalizeHandle(raw) {
  return `@${String(raw || '').replace(/^@/, '').trim().toLowerCase()}`
}

function isValidHandle(raw) {
  const clean = String(raw || '').replace(/^@/, '').trim()
  return /^[a-zA-Z0-9._]{1,30}$/.test(clean)
}

const newId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`

export const useLists = create((set, get) => ({
  whitelist: mockWhitelist,
  blacklist: mockBlacklist,

  addEntry: (type, rawUsername) => {
    if (!isValidHandle(rawUsername)) return 'invalid'
    const username = normalizeHandle(rawUsername)
    const list = get()[type] || []
    if (list.some((e) => e.username.toLowerCase() === username)) return 'duplicate'
    const entry = {
      id: newId(type === 'whitelist' ? 'w' : 'b'),
      username,
      addedAt: new Date().toISOString(),
    }
    set((state) => ({ [type]: [...state[type], entry] }))
    announceSaved()
    return 'ok'
  },

  removeEntry: (type, id) => {
    set((state) => ({
      [type]: state[type].filter((e) => e.id !== id),
    }))
    announceSaved()
  },

  // Bulk replace one list — used by Whitelist/Blacklist modal Save.
  replaceWhitelist: (whitelist) => {
    set({ whitelist })
    announceSaved()
  },

  replaceBlacklist: (blacklist) => {
    set({ blacklist })
    announceSaved()
  },
}))
