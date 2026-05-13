import { create } from 'zustand'
import { mockSubscriptions } from '@/mocks/subscriptions'
import { useToasts } from '@/stores/useToasts'

// Per-IG-account subscriptions. Mutations are local-only in V1;
// replace with API calls when backend lands. `getById` is a helper
// for the detail route.
//
// Status lifecycle:
//   active | trialing  → normal billing
//   past_due           → payment failed
//   paused             → user paused for N days; growth halted,
//                        billing skipped until pauseUntil
//   cancelled_pending  → user cancelled; full access until endsAt,
//                        then lapses (backend-shipped)
//
// All status mutations fire toasts via useToasts so the calling
// component doesn't need to thread the notification through props.
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

  setPlan: (id, plan) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, plan } : s,
      ),
    }))
    useToasts.getState().addToast({
      message: plan === 'growth' ? 'Switched to Growth plan.' : 'Switched to Advanced plan.',
      tone: 'success',
    })
  },

  pause: (id, days) => {
    const pauseUntil = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    ).toISOString()
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id
          ? { ...s, status: 'paused', pauseUntil, endsAt: null }
          : s,
      ),
    }))
    const resumeDate = new Date(pauseUntil).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    useToasts.getState().addToast({
      message: `Subscription paused — resumes ${resumeDate}.`,
      tone: 'success',
    })
  },

  cancel: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) => {
        if (s.id !== id) return s
        // Past-due users have no paid-through window — end immediately.
        const endsAt =
          s.status === 'past_due'
            ? new Date().toISOString()
            : s.trialEndsAt ?? s.nextBillingAt
        return { ...s, status: 'cancelled_pending', endsAt, pauseUntil: null }
      }),
    }))
    useToasts.getState().addToast({
      message: 'Subscription cancelled.',
      tone: 'success',
    })
  },

  payOverdue: (id) => {
    // Simulates settling the outstanding invoice — flips the
    // subscription back to active. Real billing path posts a charge
    // attempt to the backend.
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'active',
              endsAt: null,
              pauseUntil: null,
            }
          : s,
      ),
    }))
    useToasts.getState().addToast({
      message: 'Payment received. Subscription reactivated.',
      tone: 'success',
    })
  },

  resume: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id
          ? { ...s, status: 'active', endsAt: null, pauseUntil: null }
          : s,
      ),
    }))
    useToasts.getState().addToast({
      message: 'Subscription resumed.',
      tone: 'success',
    })
  },
}))
