import { create } from 'zustand'
import { mockAccounts, defaultActiveAccountId } from '@/mocks/accounts'

// Connected Instagram accounts. The sidebar AccountSwitcher writes
// `activeId`; consumers read the active account through
// `useActiveAccount`. This is the single source of truth for IG
// connection state — Overview, the sidebar AccountSwitcher, the
// MobileNavDrawer, the InstagramConnectionBanner, and SystemStatus
// all read from here.
export const useAccounts = create((set) => ({
  accounts: mockAccounts,
  activeId: defaultActiveAccountId,

  setActiveId: (id) => set({ activeId: id }),

  // Flips the connectionState on the currently-active account. Used
  // by the dashboard preset switcher so disconnected presets can be
  // applied without touching the rest of the accounts array.
  setConnectionState: (connectionState) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === state.activeId ? { ...a, connectionState } : a
      ),
    })),
}))

// Derived selector: returns the account object matching `activeId`,
// falling back to the first account if the id is stale.
export function useActiveAccount() {
  return useAccounts((s) => s.accounts.find((a) => a.id === s.activeId) ?? s.accounts[0])
}
