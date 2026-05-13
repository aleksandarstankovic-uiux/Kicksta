import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Loader2, Users, X } from 'lucide-react'
import { mockServers } from '@/mocks/servers'
import { useAccounts } from '@/stores/useAccounts'
import { useSubscriptions } from '@/stores/useSubscriptions'
import DowngradePlanConfirmModal from './DowngradePlanConfirmModal'
import PauseConfirmModal from './PauseConfirmModal'
import { formatDate } from './subscriptionShared'

const REASONS = [
  { id: 'price', label: 'Too expensive' },
  { id: 'results', label: 'Not enough results' },
  { id: 'break', label: 'Taking a break from Instagram' },
  { id: 'switching', label: 'Switching to another tool' },
  { id: 'other', label: 'Other' },
]

const COMPETITORS = [
  { value: '', label: 'Pick one (optional)' },
  { value: 'iconosquare', label: 'Iconosquare' },
  { value: 'combin', label: 'Combin' },
  { value: 'hootsuite', label: 'Hootsuite' },
  { value: 'other', label: 'Other' },
]

// Does the picked reason have a save offer for this subscription?
// Returns true when step 2 should render; false skips to step 3.
function hasSaveOffer(reasonId, subscription) {
  if (!reasonId) return false
  if (reasonId === 'other') return false
  // Past-due users skip all save offers — they're not paying.
  if (subscription?.status === 'past_due') return false
  if (reasonId === 'price') {
    // No downgrade target for Growth users (already on cheaper plan).
    return subscription?.plan === 'advanced'
  }
  return true // results, break, switching all get a save step
}

// Computes the date the cancelled subscription will end. For trial
// users it's trialEndsAt; for past-due users it's today (immediate);
// otherwise it's the next billing date.
function endsAtFor(subscription) {
  if (!subscription) return new Date().toISOString()
  if (subscription.status === 'past_due') return new Date().toISOString()
  return subscription.trialEndsAt ?? subscription.nextBillingAt
}

// 5-step cancellation flow:
//   reason   → pick a reason; "Other" reveals an optional textarea
//   save     → tailored save offer (conditional — skipped when no
//              offer matches); user can refuse and continue cancelling
//   lose     → cumulative gain headline + what they'll lose list
//   confirm  → equal-weight Keep vs Cancel buttons
//   success  → "Subscription cancelled" ack, then Done
//
// "Cancel anyway" footer link appears on reason / save / lose. It
// jumps directly to confirm. The final confirm step is the only
// gate that doesn't expose the shortcut — that screen IS the cancel.
//
// Saves trigger sub-confirmation modals (Pause, Downgrade) or
// inline mutations (Server). On any save success, the cancel flow
// closes entirely.
export default function CancelSubscriptionModal({
  open,
  subscription,
  onClose,
}) {
  const cancel = useSubscriptions((s) => s.cancel)
  const setServer = useSubscriptions((s) => s.setServer)
  const accounts = useAccounts((s) => s.accounts)
  const account = accounts.find((a) => a.id === subscription?.accountId)
  const username = account?.username ?? '@account'

  const [step, setStep] = useState('reason')
  const [selectedReason, setSelectedReason] = useState(null)
  const [otherDetail, setOtherDetail] = useState('')
  const [serverPick, setServerPick] = useState(subscription?.server ?? null)
  const [pauseDays, setPauseDays] = useState(null) // 30 | 60 | 90 | null
  const [downgradeOpen, setDowngradeOpen] = useState(false)
  const [switchingTool, setSwitchingTool] = useState('')
  const [switchingDetail, setSwitchingDetail] = useState('')

  // Reset all state whenever the modal opens fresh.
  useEffect(() => {
    if (open) {
      setStep('reason')
      setSelectedReason(null)
      setOtherDetail('')
      setServerPick(subscription?.server ?? null)
      setPauseDays(null)
      setDowngradeOpen(false)
      setSwitchingTool('')
      setSwitchingDetail('')
    }
  }, [open, subscription?.server])

  // Auto-advance processing → success.
  useEffect(() => {
    if (step !== 'processing') return
    const id = setTimeout(() => setStep('success'), 1500)
    return () => clearTimeout(id)
  }, [step])

  // ESC closes the flow except during processing.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape' && step !== 'processing') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  if (!open || !subscription) return null

  const endsAt = endsAtFor(subscription)
  const offers = hasSaveOffer(selectedReason, subscription)

  function handleContinueReason() {
    setStep(offers ? 'save' : 'lose')
  }

  function handleSkipSave() {
    setStep('lose')
  }

  function handleCancelAnyway() {
    setStep('confirm')
  }

  function handleFinalConfirm() {
    setStep('processing')
  }

  function handleDone() {
    cancel(subscription.id)
    onClose?.()
  }

  function handleServerSave() {
    if (serverPick && serverPick !== subscription.server) {
      setServer(subscription.id, serverPick)
    }
    onClose?.()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'processing') onClose?.()
      }}
    >
      <div className="w-full rounded-t-2xl bg-surface shadow-xl lg:mx-4 lg:max-w-md lg:rounded-2xl">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold text-text-primary">
            Cancel subscription for {username}
          </h2>
          {step !== 'processing' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-5 pb-5 pt-3">
          {step === 'reason' && (
            <>
              <p className="text-sm text-text-secondary">
                Why are you cancelling? (helps us improve)
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {REASONS.map((r) => {
                  const selected = selectedReason === r.id
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedReason(r.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          selected
                            ? 'border-blue-base bg-blue-tint/40 text-text-primary'
                            : 'border-border bg-surface text-text-primary hover:bg-bg'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-blue-base'
                              : 'border-border-strong'
                          }`}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-blue-base" />
                          )}
                        </span>
                        <span className="font-medium">{r.label}</span>
                      </button>

                      {selected && r.id === 'other' && (
                        <div className="mt-2">
                          <textarea
                            value={otherDetail}
                            onChange={(e) => setOtherDetail(e.target.value)}
                            rows={3}
                            placeholder="Tell us more (optional, but helpful)"
                            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              <button
                type="button"
                onClick={handleContinueReason}
                disabled={!selectedReason}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={handleCancelAnyway}
                disabled={!selectedReason}
                className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel anyway
              </button>
            </>
          )}

          {step === 'save' && (
            <>
              {selectedReason === 'price' && (
                <SaveOfferPrice
                  onAccept={() => setDowngradeOpen(true)}
                  onSkip={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
              {selectedReason === 'results' && (
                <SaveOfferServer
                  subscription={subscription}
                  serverPick={serverPick}
                  setServerPick={setServerPick}
                  onAccept={handleServerSave}
                  onSkip={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
              {selectedReason === 'break' && (
                <SaveOfferPause
                  onPick={(days) => setPauseDays(days)}
                  onSkip={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
              {selectedReason === 'switching' && (
                <SaveOfferSwitching
                  tool={switchingTool}
                  setTool={setSwitchingTool}
                  detail={switchingDetail}
                  setDetail={setSwitchingDetail}
                  onContinue={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
            </>
          )}

          {step === 'lose' && (
            <>
              <p className="text-sm text-text-secondary">
                Here's what will happen:
              </p>

              <div className="mt-3 flex items-start gap-3 rounded-xl border border-blue-base/20 bg-blue-tint/40 p-4">
                <Users
                  className="mt-0.5 h-5 w-5 shrink-0 text-blue-text"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    +{subscription.totalFollowersGained} followers gained from Kicksta
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Cumulative growth since you subscribed.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium text-text-primary">
                After {formatDate(endsAt)}, you'll lose:
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                <LoseRow text="Targeted Growth (auto-follow + auto-like)" />
                <LoseRow text="All active targets and filters" />
                <LoseRow text="Whitelist and blacklist (kept for 30 days)" />
                {subscription.plan === 'advanced' && (
                  <LoseRow text="Welcome DMs and Advanced-tier features" />
                )}
                {subscription.growthPlus && (
                  <LoseRow text="Growth+ boost network access" />
                )}
              </ul>

              <p className="mt-4 text-xs text-text-muted">
                You'll keep full access until {formatDate(endsAt)}.
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(offers ? 'save' : 'reason')}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90"
                >
                  Continue
                </button>
              </div>
              <button
                type="button"
                onClick={handleCancelAnyway}
                className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Cancel anyway
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <p className="text-sm font-semibold text-text-primary">
                Are you sure?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Your subscription for{' '}
                <span className="font-semibold text-text-primary">
                  {username}
                </span>{' '}
                will end on{' '}
                <span className="font-semibold text-text-primary">
                  {formatDate(endsAt)}
                </span>
                . You won't be charged again. You'll keep full access
                until then.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-green-base text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Keep my subscription
                </button>
                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-red-tint text-base font-semibold text-red-text transition-colors hover:bg-red-tint/70"
                >
                  Cancel subscription
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
              <p className="mt-3 text-base font-medium text-text-primary">
                Cancelling your subscription...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
                <CheckCircle2 className="h-6 w-6 text-green-text" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Subscription cancelled
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                {username} will keep full access until {formatDate(endsAt)}.
                We'll send a reminder before it ends.
              </p>
              <button
                type="button"
                onClick={handleDone}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      <DowngradePlanConfirmModal
        open={downgradeOpen}
        subscription={subscription}
        onClose={() => setDowngradeOpen(false)}
        onSuccess={() => {
          setDowngradeOpen(false)
          onClose?.()
        }}
      />

      <PauseConfirmModal
        subscription={subscription}
        days={pauseDays}
        onClose={() => setPauseDays(null)}
        onSuccess={() => {
          setPauseDays(null)
          onClose?.()
        }}
      />
    </div>,
    document.body,
  )
}

function LoseRow({ text }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <X
        className="mt-0.5 h-4 w-4 shrink-0 text-red-text"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span className="text-text-secondary line-through">{text}</span>
    </li>
  )
}

function SaveOfferPrice({ onAccept, onSkip, onCancelAnyway }) {
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Try Growth at $29/mo instead?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        You'd save $20/mo. You'll keep core targeting, filters, and
        whitelist/blacklist — only Advanced-tier features (Welcome DMs,
        gender targeting, close friends adder) would be removed.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          Downgrade to Growth
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
        >
          No thanks, continue cancelling
        </button>
      </div>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}

function SaveOfferServer({
  subscription,
  serverPick,
  setServerPick,
  onAccept,
  onSkip,
  onCancelAnyway,
}) {
  const current = mockServers.find((s) => s.id === subscription.server)
  const others = mockServers.filter((s) => s.id !== subscription.server)
  const canSave = serverPick && serverPick !== subscription.server
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Want to try a different server first?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Server region affects growth speed and IG safety. Switching takes
        effect immediately — some users see 40% better results within 2
        weeks of changing servers.
      </p>
      <div className="mt-4 rounded-lg border border-border bg-bg p-3 text-sm">
        <p className="text-text-secondary">
          Current: <span className="font-medium text-text-primary">{current.region}</span>
        </p>
        <label
          htmlFor="server-pick"
          className="mt-3 block text-xs font-medium text-text-secondary"
        >
          Switch to
        </label>
        <select
          id="server-pick"
          value={serverPick ?? subscription.server}
          onChange={(e) => setServerPick(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
        >
          <option value={subscription.server} disabled>
            {current.region} (current)
          </option>
          {others.map((s) => (
            <option key={s.id} value={s.id}>
              {s.region}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={onAccept}
          disabled={!canSave}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Switch server
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
        >
          No thanks, continue cancelling
        </button>
      </div>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}

function SaveOfferPause({ onPick, onSkip, onCancelAnyway }) {
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Want to pause instead?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Growth stops, billing pauses, your targets and settings are
        kept. Auto-resumes on the date you choose.
      </p>
      <p className="mt-4 text-xs font-medium text-text-secondary">How long?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[30, 60, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onPick(d)}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold text-text-primary transition-colors hover:border-yellow-base hover:bg-yellow-tint hover:text-yellow-text"
          >
            {d} days
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
      >
        No thanks, continue cancelling
      </button>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}

function SaveOfferSwitching({
  tool,
  setTool,
  detail,
  setDetail,
  onContinue,
  onCancelAnyway,
}) {
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Which tool are you switching to?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Optional — your honest answer helps us improve. We won't try
        to sell you on staying.
      </p>
      <label
        htmlFor="switching-tool"
        className="mt-4 block text-xs font-medium text-text-secondary"
      >
        Tool
      </label>
      <select
        id="switching-tool"
        value={tool}
        onChange={(e) => setTool(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
      >
        {COMPETITORS.map((c) => (
          <option key={c.value || 'empty'} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <label
        htmlFor="switching-detail"
        className="mt-3 block text-xs font-medium text-text-secondary"
      >
        Anything else? (optional)
      </label>
      <textarea
        id="switching-detail"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        rows={2}
        placeholder="What made you switch?"
        className="mt-1 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
      />
      <button
        type="button"
        onClick={onContinue}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Continue cancelling
      </button>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}
