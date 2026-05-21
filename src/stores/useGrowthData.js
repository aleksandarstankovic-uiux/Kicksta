import { create } from 'zustand'
import { mockGrowthDaily } from '@/mocks/growth'

// Wraps the mockGrowthDaily import so the preset switcher can swap
// to first-day / last-day / empty chart data without changing the
// consuming components (GrowthChart, the three metric sparklines).
export const useGrowthData = create((set) => ({
  daily: mockGrowthDaily,
  setDaily: (daily) => set({ daily }),
}))
