import { create } from 'zustand'
import { mockPaymentMethods } from '@/mocks/paymentMethods'
import { useToasts } from '@/stores/useToasts'

const newId = () => `pm_${Math.random().toString(36).slice(2, 8)}`

// Multi-card store. The primary card is the one billed for every
// subscription on the account. Mutations enforce the invariant
// that exactly one card is primary at all times and at least one
// card is on file.
export const usePaymentMethods = create((set, get) => ({
  cards: mockPaymentMethods,

  addCard: (data) => {
    const card = {
      id: newId(),
      brand: data.brand ?? 'card',
      last4: data.last4,
      expMonth: data.expMonth,
      expYear: data.expYear,
      primary: false,
      billingEmail: data.billingEmail,
    }
    set((state) => ({ cards: [...state.cards, card] }))
    useToasts.getState().addToast({ message: 'Card added.', tone: 'success' })
  },

  removeCard: (id) => {
    const cards = get().cards
    if (cards.length <= 1) {
      useToasts.getState().addToast({
        message: 'You need at least one card on file.',
        tone: 'error',
      })
      return
    }
    const target = cards.find((c) => c.id === id)
    if (target?.primary) {
      useToasts.getState().addToast({
        message: "You can't remove the primary card. Set a different card as primary first.",
        tone: 'error',
      })
      return
    }
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }))
    useToasts.getState().addToast({ message: 'Card removed.', tone: 'success' })
  },

  setPrimary: (id) => {
    set((state) => ({
      cards: state.cards.map((c) => ({ ...c, primary: c.id === id })),
    }))
    useToasts.getState().addToast({ message: 'Primary card updated.', tone: 'success' })
  },

  updateCard: (id, patch) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
    useToasts.getState().addToast({ message: 'Payment method updated.', tone: 'success' })
  },
}))
