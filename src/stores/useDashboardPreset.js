// src/stores/useDashboardPreset.js
import { create } from 'zustand'
import { useUserStore } from '@/stores/useUserStore'
import { useAccounts } from '@/stores/useAccounts'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { useLists } from '@/stores/useLists'
import { useActivityFeed } from '@/stores/useActivityFeed'
import { useGrowthData } from '@/stores/useGrowthData'
import { useInstagramAudit } from '@/stores/useInstagramAudit'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import { useUiState } from '@/stores/useUiState'
import { useToasts } from '@/stores/useToasts'
import { PRESETS, DEFAULT_PRESET } from '@/mocks/presets'

const STORAGE_KEY = 'kicksta-dashboard-preset'

function loadPreset() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && PRESETS[stored]) return stored
  } catch {
    // localStorage unavailable (SSR, sandboxed iframe, etc.)
  }
  return DEFAULT_PRESET
}

function savePreset(presetId) {
  try {
    localStorage.setItem(STORAGE_KEY, presetId)
  } catch {
    // ignore — saving is a nice-to-have
  }
}

function clearStoredPreset() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// Imperative seed: mutates every store the dashboard reads from so
// the entire UI snaps to the preset. Called by applyPreset() AND on
// module load if a stored preset != default exists in localStorage.
function seedAllStores(presetId) {
  const recipe = PRESETS[presetId]
  if (!recipe) return
  useUserStore.setState({ user: recipe.user })
  useAccounts.getState().setConnectionState(recipe.connectionState)
  useTargetsStore.setState({ targets: recipe.targets })
  useLists.setState({ whitelist: recipe.whitelist, blacklist: recipe.blacklist })
  useActivityFeed.setState({ items: recipe.activity })
  useGrowthData.setState({ daily: recipe.growthDaily })
  useInstagramAudit.setState({ lastDownloadedAt: recipe.auditDownloadedAt })
  useGrowthPlusSubscription.setState({
    subscribed: recipe.growthPlusSubscribed,
    status: recipe.growthPlusStatus,
  })
  useUiState.setState({ trialBannerDismissed: false })
}

const initialPreset = loadPreset()

export const useDashboardPreset = create((set) => ({
  preset: initialPreset,
  applyPreset: (name) => {
    if (!PRESETS[name]) return
    seedAllStores(name)
    savePreset(name)
    set({ preset: name })
    useToasts.getState().addToast({
      message: `State: ${PRESETS[name].label}`,
      tone: 'success',
    })
  },
  reset: () => {
    clearStoredPreset()
    seedAllStores(DEFAULT_PRESET)
    set({ preset: DEFAULT_PRESET })
    useToasts.getState().addToast({
      message: 'Reset to default state.',
      tone: 'success',
    })
  },
}))

// If the user previously saved a non-default preset, apply it now so
// the dashboard boots into that state. Synchronous at module load so
// there's no flash of default content before the preset takes hold.
if (initialPreset !== DEFAULT_PRESET) {
  seedAllStores(initialPreset)
}
