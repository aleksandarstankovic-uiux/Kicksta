// src/mocks/presets.js
import { mockUser } from '@/mocks/user'
import { mockTargets } from '@/mocks/targets'
import { mockWhitelist } from '@/mocks/whitelist'
import { mockBlacklist } from '@/mocks/blacklist'
import { mockActivity } from '@/mocks/activity'
import { mockGrowthDaily, mockGrowthDailyEmpty } from '@/mocks/growth'

// Helpers to anchor dates relative to "now" so the trial windows
// stay meaningful regardless of when the dashboard is opened.
const now = () => new Date()
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

// 11pm-today helper for "trial ends today" cases — mirrors the
// existing logic in @/mocks/user so the last-day banner fires.
const trialEndsToday11pm = () => {
  const d = new Date()
  d.setHours(23, 0, 0, 0)
  return d.toISOString()
}

const userFirstTrialDay = {
  ...mockUser,
  isOnTrial: true,
  createdAt: now().toISOString(),
  trialEndsAt: daysFromNow(7).toISOString(),
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

const userLastTrialDay = {
  ...mockUser,
  isOnTrial: true,
  createdAt: daysAgo(7).toISOString(),
  trialEndsAt: trialEndsToday11pm(),
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

const userTrialDisconnected = {
  ...mockUser,
  isOnTrial: true,
  createdAt: daysAgo(3).toISOString(),
  trialEndsAt: daysFromNow(4).toISOString(),
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

const userActive = {
  ...mockUser,
  isOnTrial: false,
  trialEndsAt: null,
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

// The default preset that loads on first visit (no localStorage entry).
// Matches the current dashboard default — active subscription, IG
// connected, full data populated.
export const DEFAULT_PRESET = 'active-populated'

// Each recipe is consumed by `seedAllStores()` in useDashboardPreset.
// Keep keys aligned with what seedAllStores reads.
export const PRESETS = {
  'trial-first-day': {
    label: 'Trial — First day',
    user: userFirstTrialDay,
    connectionState: 'connected',
    targets: [],
    whitelist: [],
    blacklist: [],
    activity: [],
    growthDaily: mockGrowthDailyEmpty,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'trial-last-day': {
    label: 'Trial — Last day',
    user: userLastTrialDay,
    connectionState: 'connected',
    targets: mockTargets,
    whitelist: mockWhitelist,
    blacklist: mockBlacklist,
    activity: mockActivity,
    growthDaily: mockGrowthDaily,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'trial-disconnected': {
    label: 'Trial — Disconnected',
    user: userTrialDisconnected,
    connectionState: 'disconnected',
    targets: [],
    whitelist: [],
    blacklist: [],
    activity: [],
    growthDaily: mockGrowthDailyEmpty,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'active-empty': {
    label: 'Active — Empty',
    user: userActive,
    connectionState: 'connected',
    targets: [],
    whitelist: [],
    blacklist: [],
    activity: [],
    growthDaily: mockGrowthDailyEmpty,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'active-populated': {
    label: 'Active — Populated',
    user: userActive,
    connectionState: 'connected',
    targets: mockTargets,
    whitelist: mockWhitelist,
    blacklist: mockBlacklist,
    activity: mockActivity,
    growthDaily: mockGrowthDaily,
    auditDownloadedAt: new Date().toISOString(),
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'active-disconnected': {
    label: 'Active — Disconnected',
    user: userActive,
    connectionState: 'disconnected',
    targets: mockTargets,
    whitelist: mockWhitelist,
    blacklist: mockBlacklist,
    activity: mockActivity,
    growthDaily: mockGrowthDaily,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
}

// Grouped metadata for the widget UI — controls the section labels
// and the per-row description copy. Order here is order in the panel.
export const PRESET_GROUPS = [
  {
    label: 'Trial',
    presets: [
      {
        id: 'trial-first-day',
        label: 'Trial — First day',
        description: 'No targets yet, forecast-only chart.',
      },
      {
        id: 'trial-last-day',
        label: 'Trial — Last day',
        description: 'Ends today, banner shows.',
      },
      {
        id: 'trial-disconnected',
        label: 'Trial — Disconnected',
        description: 'Mid-trial, IG disconnected.',
      },
    ],
  },
  {
    label: 'Active',
    presets: [
      {
        id: 'active-empty',
        label: 'Active — Empty',
        description: 'Just connected, no data.',
      },
      {
        id: 'active-populated',
        label: 'Active — Populated',
        description: 'Normal full dashboard.',
      },
    ],
  },
  {
    label: 'Disconnected',
    presets: [
      {
        id: 'active-disconnected',
        label: 'Active — Disconnected',
        description: 'Subscription active, IG dropped.',
      },
    ],
  },
]

// Two-letter abbreviation shown in the badge on the collapsed widget
// button so the user sees the active preset without opening the panel.
export const PRESET_ABBREV = {
  'trial-first-day': 'T1',
  'trial-last-day': 'T7',
  'trial-disconnected': 'TX',
  'active-empty': 'A0',
  'active-populated': 'AP',
  'active-disconnected': 'AX',
}
