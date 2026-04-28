import { create } from 'zustand'
import { mockNotifications } from '@/mocks/notifications'

// Notifications store. The dashboard uses this for the bell-icon dropdown
// in DashboardLayout. Read state is mutable — opening the dropdown marks
// items as read; users can also dismiss the badge with a single click.
export const useNotifications = create((set) => ({
  items: mockNotifications,

  markAsRead: (id) => {
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  },

  markAllRead: () => {
    set((state) => ({
      items: state.items.map((n) => (n.read ? n : { ...n, read: true })),
    }))
  },
}))
