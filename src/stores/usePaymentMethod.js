import { create } from 'zustand'
import { mockPaymentMethod } from '@/mocks/paymentMethod'
import { useToasts } from '@/stores/useToasts'

// Single card on file. All subscriptions bill against this card.
// `update` accepts a partial — callers pass only the fields they
// changed.
export const usePaymentMethod = create((set) => ({
  ...mockPaymentMethod,

  update: (patch) => {
    set((state) => ({ ...state, ...patch }))
    useToasts.getState().addToast({ message: 'Payment method updated.', tone: 'success' })
  },
}))
