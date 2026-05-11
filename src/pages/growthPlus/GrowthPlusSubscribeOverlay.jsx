import { Check, Sparkles } from 'lucide-react'

const BENEFITS = [
  'Algorithmic post boosting',
  '+34% post reach on average',
  'Active-account engagement signals',
]

// Floating subscribe overlay shown over the blurred GrowthPlusActive
// in the locked-preview state. Compact, focused CTA — not a full
// marketing page (the signup step plays that role). Premium gradient
// + Sparkles + 3-benefit list + Add Growth+ button.
export default function GrowthPlusSubscribeOverlay({ onSubscribeClick }) {
  return (
    <div className="absolute left-1/2 top-24 z-10 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
      <div className="rounded-2xl border border-purple-base/30 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-6 shadow-xl md:p-8">
        <div className="flex justify-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-7 w-7" />
          </span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-semibold text-text-primary">
          Unlock Growth+
        </h2>
        <p className="mt-1 text-center text-sm text-text-secondary">
          See exactly this for your account.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-text-primary">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-purple-base"
                aria-hidden="true"
                strokeWidth={2.5}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSubscribeClick}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-purple-base text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Add Growth+ — $49/mo
        </button>

        <p className="mt-3 text-center text-xs text-text-muted">
          Cancel anytime · Add later from your dashboard
        </p>
      </div>
    </div>
  )
}
