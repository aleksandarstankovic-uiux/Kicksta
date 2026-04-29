import { create } from 'zustand'
import { mockSubscriptions } from '@/mocks/subscriptions'
import { useToasts } from '@/stores/useToasts'

// Per-IG-account subscriptions. Mutations here are local-only in
// V1; replace with API calls when backend lands. `getById` is a
// helper for the detail route.
export const useSubscriptions = create((set, get) => ({
  subscriptions: mockSubscriptions,

  getById: (id) => get().subscriptions.find((s) => s.id === id),

  setServer: (id, serverId) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, server: serverId } : s,
      ),
    }))
    useToasts.getState().addToast({ message: 'Server updated.', tone: 'success' })
  },

  toggleGrowthPlus: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, growthPlus: !s.growthPlus } : s,
      ),
    }))
    const sub = get().subscriptions.find((s) => s.id === id)
    useToasts.getState().addToast({
      message: sub?.growthPlus ? 'Growth+ added.' : 'Growth+ removed.',
      tone: 'success',
    })
  },
}))
