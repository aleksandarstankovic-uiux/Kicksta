import { create } from 'zustand'
import { mockActivity } from '@/mocks/activity'

// Wraps the mockActivity import so the preset switcher can swap to
// an empty list (or any variant) without changing the consuming
// component. Currently consumed by ActivityFeed on the Overview page.
export const useActivityFeed = create((set) => ({
  items: mockActivity,
  setItems: (items) => set({ items }),
}))
