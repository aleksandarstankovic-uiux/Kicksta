import { create } from 'zustand'
import { mockAccounts, defaultActiveAccountId } from '@/mocks/accounts'

// Connected Instagram accounts. The sidebar AccountSwitcher writes
// `activeId`; pages and the AccountCard / AccountStripe read the active
// account through `useActiveAccount`. Any consumer that previously
// reached for `mockInstagram` directly can switch to this store to
// reflect the user's currently selected account.
export const useAccounts = create((set) => ({
  accounts: mockAccounts,
  activeId: defaultActiveAccountId,

  setActiveId: (id) => set({ activeId: id }),
}))

// Derived selector: returns the account object matching `activeId`,
// falling back to the first account if the id is stale.
export function useActiveAccount() {
  return useAccounts((s) => s.accounts.find((a) => a.id === s.activeId) ?? s.accounts[0])
}
