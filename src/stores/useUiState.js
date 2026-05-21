import { create } from 'zustand'

// Preset-related UI state that should reset when the user flips the
// dashboard state switcher. Currently holds the closeable trial-banner
// dismissal flag; future preset-aware UI bits land here too.
export const useUiState = create((set) => ({
  trialBannerDismissed: false,
  setTrialBannerDismissed: (dismissed) => set({ trialBannerDismissed: dismissed }),
}))
