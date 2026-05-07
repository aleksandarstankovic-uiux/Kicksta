import { create } from 'zustand'

// Mobile nav drawer open-state. Lifted out of MobileNavDrawer's
// local component state so other surfaces (notifically: the
// NotificationBell in the mobile top header) can dismiss the
// drawer before opening their own panel — drawer + bell otherwise
// stack on top of each other while both are open.
export const useNavDrawer = create((set) => ({
  open: false,
  openDrawer: () => set({ open: true }),
  closeDrawer: () => set({ open: false }),
}))
