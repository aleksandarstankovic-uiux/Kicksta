import { create } from 'zustand'

// Global toast store. Any component can fire a toast via:
//   useToasts.getState().addToast({ message, tone: 'success' })
// Toasts auto-dismiss after 2500ms unless `duration` is overridden.

let nextId = 1

export const useToasts = create((set, get) => ({
  toasts: [],

  addToast: ({ message, tone = 'success', duration = 2500 }) => {
    const id = nextId++
    set((state) => ({
      toasts: [...state.toasts, { id, message, tone, duration }],
    }))
    if (duration > 0) {
      setTimeout(() => {
        get().dismissToast(id)
      }, duration)
    }
    return id
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
