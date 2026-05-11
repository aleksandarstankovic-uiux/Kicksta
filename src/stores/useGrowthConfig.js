import { create } from 'zustand'
import { mockGrowthConfig } from '@/mocks/growthConfig'
import { useToasts } from '@/stores/useToasts'

// Debounced "Settings saved." toast — rapid changes (DM typing, range
// inputs) don't spam. One shared timer across the whole store.
let toastTimer = null
function announceSaved() {
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    useToasts.getState().addToast({
      message: 'Settings saved.',
      tone: 'success',
    })
    toastTimer = null
  }, 1500)
}

export const useGrowthConfig = create((set, get) => ({
  config: mockGrowthConfig,

  setMode: (mode) => {
    set((state) => ({ config: { ...state.config, mode } }))
    announceSaved()
  },

  toggleLikeAfterFollow: () => {
    set((state) => ({
      config: { ...state.config, likeAfterFollow: !state.config.likeAfterFollow },
    }))
    announceSaved()
  },

  toggleWelcomeDm: () => {
    set((state) => ({
      config: {
        ...state.config,
        welcomeDm: { ...state.config.welcomeDm, enabled: !state.config.welcomeDm.enabled },
      },
    }))
    announceSaved()
  },

  setWelcomeDmMessage: (message) => {
    set((state) => ({
      config: {
        ...state.config,
        welcomeDm: { ...state.config.welcomeDm, message },
      },
    }))
    announceSaved()
  },

  toggleCloseFriends: () => {
    set((state) => ({
      config: {
        ...state.config,
        closeFriendsAdder: {
          ...state.config.closeFriendsAdder,
          enabled: !state.config.closeFriendsAdder.enabled,
        },
      },
    }))
    announceSaved()
  },

  setCloseFriendsMode: (mode) => {
    set((state) => ({
      config: {
        ...state.config,
        closeFriendsAdder: { ...state.config.closeFriendsAdder, mode },
      },
    }))
    announceSaved()
  },

  setFilter: (key, value) => {
    set((state) => {
      const next = { ...state.config.filters }
      if (key === 'followingRange') {
        next.followingMin = value.min
        next.followingMax = value.max
      } else if (key === 'followerRange') {
        next.followerMin = value.min
        next.followerMax = value.max
      } else if (key === 'mediaRange') {
        next.mediaMin = value.min
        next.mediaMax = value.max
      } else {
        next[key] = value
      }
      return { config: { ...state.config, filters: next } }
    })
    announceSaved()
  },

  toggleExcludeNsfw: () => {
    set((state) => ({
      config: {
        ...state.config,
        filters: { ...state.config.filters, excludeNsfw: !state.config.filters.excludeNsfw },
      },
    }))
    announceSaved()
  },

  toggleGrowthPlusActive: () => {
    set((state) => ({
      config: { ...state.config, growthPlusActive: !state.config.growthPlusActive },
    }))
    announceSaved()
  },

  toggleGrowthPlusEnabled: () => {
    set((state) => ({
      config: {
        ...state.config,
        growthPlusControls: {
          ...state.config.growthPlusControls,
          enabled: !state.config.growthPlusControls.enabled,
        },
      },
    }))
    announceSaved()
  },

  setGrowthPlusSpeed: (speed) => {
    set((state) => ({
      config: {
        ...state.config,
        growthPlusControls: { ...state.config.growthPlusControls, speed },
      },
    }))
    announceSaved()
  },

  setGrowthPlusQuality: (quality) => {
    set((state) => ({
      config: {
        ...state.config,
        growthPlusControls: { ...state.config.growthPlusControls, quality },
      },
    }))
    announceSaved()
  },
}))
