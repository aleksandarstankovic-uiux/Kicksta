import { create } from 'zustand'
import { mockUser } from '@/mocks/user'

// Single source of truth for the dashboard user. Components that
// previously did `import { mockUser } from '@/mocks/user'` and read
// `mockUser.isOnTrial` / `.plan` / `.growthPlusSubscribed` etc. now
// pull this from the store so the preset switcher can reseed it.
//
// The full PLAN_CATALOG / mockGrowthPlusNextBillingAt / mockUserGrowthPlus
// exports stay in @/mocks/user — only the live "current user" gets
// hoisted into the store.
export const useUserStore = create((set) => ({
  user: mockUser,
  setUser: (user) => set({ user }),
}))
