import { create } from 'zustand'

// V1 override flag + cancellation lifecycle for the user's Growth+
// subscription. Status state machine:
//   active             → subscriber, full dashboard
//   cancelled_pending  → cancelled but paid-through; renders dashboard
//                        with banner + pill + billing-card adjustments
//   lapsed             → period ended; renders Upsell page
//
// `subscribed` stays for back-compat with the existing consumer in
// /growth-plus index.jsx until that consumer is migrated to `status`.
// Treat `subscribed === true` as `status === 'active'` for now.
//
// `endsAt` is an ISO date string set when the user cancels (mirrors
// `mockGrowthPlusNextBillingAt` at cancel time) and cleared on resume.
//
// _lapseForTesting() is a QA helper to flip into the lapsed state
// without waiting for the clock.
export const useGrowthPlusSubscription = create((set) => ({
  subscribed: null,
  status: 'active', // 'active' | 'cancelled_pending' | 'lapsed'
  endsAt: null,
  markSubscribed: () =>
    set({ subscribed: true, status: 'active', endsAt: null }),
  cancel: (endsAt) =>
    set({ status: 'cancelled_pending', endsAt }),
  resume: () =>
    set({ status: 'active', endsAt: null }),
  _lapseForTesting: () =>
    set({ status: 'lapsed', subscribed: false, endsAt: null }),
}))
