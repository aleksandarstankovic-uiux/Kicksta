import { create } from 'zustand'
import { mockUser } from '@/mocks/user'
import { useToasts } from '@/stores/useToasts'

// Split "First Last" → { firstName, lastName }. If the mock has only
// one token we keep it in firstName and leave lastName empty.
function splitName(full) {
  const parts = String(full ?? '').trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') ?? '',
  }
}

const initialName = splitName(mockUser.name)

// User profile (the human, not the IG account). Edits here propagate
// to the profile dropdown and Account header. SMS comm pref auto-
// flips off if the phone number is removed.
export const useUserProfile = create((set) => ({
  firstName: initialName.firstName,
  lastName: initialName.lastName,
  email: mockUser.email,
  phoneCountry: 'US',
  phoneNumber: null,

  setName: ({ firstName, lastName }) => {
    set({ firstName: firstName.trim(), lastName: lastName.trim() })
    useToasts.getState().addToast({ message: 'Name updated.', tone: 'success' })
  },

  setEmail: (email) => {
    set({ email: email.trim() })
    useToasts.getState().addToast({
      message: `Verification link sent to ${email.trim()}.`,
      tone: 'success',
    })
  },

  setPhone: ({ country, number }) => {
    const trimmed = number?.trim() || null
    set({ phoneCountry: country, phoneNumber: trimmed })
    useToasts.getState().addToast({
      message: trimmed ? 'Phone number updated.' : 'Phone number removed.',
      tone: 'success',
    })
  },

  // Mock password change. Resolves with `{ ok: true }` if `current`
  // matches a fake stored value ("password"), else `{ ok: false, error }`.
  // Replace with real call when backend lands.
  changePassword: async ({ current, next }) => {
    if (current !== 'password') {
      return { ok: false, error: 'Current password is incorrect.' }
    }
    if (!next || next.length < 8) {
      return { ok: false, error: 'New password must be at least 8 characters.' }
    }
    useToasts.getState().addToast({ message: 'Password updated.', tone: 'success' })
    return { ok: true }
  },
}))
