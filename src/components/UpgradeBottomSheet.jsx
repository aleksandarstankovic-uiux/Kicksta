import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles, X } from 'lucide-react'

// Shared upgrade sheet. Opens from any plan-gated feature. Each feature
// has its own headline + benefit copy + list of unlocks; pick via the
// `feature` prop.

const FEATURE_CONTENT = {
  welcome_dm: {
    headline: 'Unlock Welcome DM',
    benefit: 'Auto-DM new followers and welcome them into your audience.',
    unlocks: [
      'Welcome DM automation',
      'Close Friends Adder',
      'Gender filter',
      '30 target slots',
    ],
  },
  close_friends: {
    headline: 'Unlock Close Friends Adder',
    benefit: 'Automatically add new followers to your Close Friends list.',
    unlocks: [
      'Close Friends Adder',
      'Welcome DM automation',
      'Gender filter',
      '30 target slots',
    ],
  },
  gender_filter: {
    headline: 'Unlock Gender targeting',
    benefit:
      'Refine targeting to a specific gender for better-qualified followers.',
    unlocks: [
      'Gender filter',
      'Welcome DM automation',
      'Close Friends Adder',
      '30 target slots',
    ],
  },
  targets_slots: {
    headline: 'Unlock 30 target slots',
    benefit: 'Track 3× more accounts and hashtags at once.',
    unlocks: [
      '30 target slots',
      'Welcome DM automation',
      'Close Friends Adder',
      'Gender filter',
    ],
  },
}

export default function UpgradeBottomSheet({ open, onClose, feature = 'welcome_dm' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const content = FEATURE_CONTENT[feature] ?? FEATURE_CONTENT.welcome_dm

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.headline}
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-md lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-blue-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-text-primary">
              {content.headline}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{content.benefit}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Unlocks list */}
        <ul className="mt-4 flex flex-col gap-2 px-5">
          {content.unlocks.map((u) => (
            <li key={u} className="flex items-center gap-2 text-sm text-text-primary">
              <Check className="h-4 w-4 shrink-0 text-green-base" aria-hidden="true" />
              {u}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border px-5 py-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <Link
            to="/signup/plan-selection"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Upgrade to Advanced
          </Link>
        </div>
      </div>
    </div>
  )
}
