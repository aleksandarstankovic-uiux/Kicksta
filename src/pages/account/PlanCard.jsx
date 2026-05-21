import { useEffect, useState } from 'react'
import { Layers } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
import ConfirmGrowthPlusModal from './ConfirmGrowthPlusModal'

const PLAN_PRICE = { growth: 29, advanced: 49 }
const PLAN_LABEL = { growth: 'Growth', advanced: 'Advanced' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Plan summary card. When the subscription is paused or
// cancelled_pending we hide the Upgrade / Growth+ controls — they're
// on their way out — and replace them with a single Resume button.
export default function PlanCard({ subscription }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const resume = useSubscriptions((s) => s.resume)

  const planPrice = PLAN_PRICE[subscription.plan]
  const total = planPrice + (subscription.growthPlus ? 10 : 0)
  const isAdvanced = subscription.plan === 'advanced'
  const isOnHold =
    subscription.status === 'paused' ||
    subscription.status === 'cancelled_pending'
  // Past-due users can't change plan or add Growth+ until they
  // resolve the outstanding invoice — keep CTAs hidden, the
  // SubscriptionStateBanner above handles their path forward.
  const isPastDue = subscription.status === 'past_due'

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="blue" icon={Layers} />
        <h2 className="text-base font-semibold text-text-primary">Plan</h2>
        <InfoTooltip text="What you pay each month. Upgrade to unlock more growth slots and Welcome DMs." />
      </div>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary">{PLAN_LABEL[subscription.plan]} plan</dt>
          <dd className="font-medium text-text-primary">${planPrice}/mo</dd>
        </div>
        {subscription.growthPlus && (
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Growth+ add-on</dt>
            <dd className="font-medium text-text-primary">+$10/mo</dd>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
          <dt className="text-text-primary">Total</dt>
          <dd className="font-semibold text-text-primary">${total}/mo</dd>
        </div>
      </dl>

      {subscription.status === 'trialing' && subscription.trialEndsAt && (
        <p className="mt-3 text-xs text-text-secondary">
          Trial ends {formatDate(subscription.trialEndsAt)}.
        </p>
      )}

      {isOnHold ? (
        <div className="mt-4">
          <button
            onClick={() => resume(subscription.id)}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-green-base px-4 text-sm font-semibold text-white hover:opacity-90 md:w-auto"
          >
            Resume subscription
          </button>
        </div>
      ) : isPastDue ? null : (
        <div className="mt-4 grid grid-cols-2 gap-2 md:flex md:flex-wrap">
          <button
            disabled={isAdvanced}
            onClick={() => setUpgradeOpen(true)}
            title={isAdvanced ? 'Already on the Advanced plan' : undefined}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            Upgrade plan
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg md:w-auto"
          >
            {subscription.growthPlus ? 'Remove Growth+' : 'Add Growth+'}
          </button>
        </div>
      )}

      <UpgradeStubModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ConfirmGrowthPlusModal
        open={confirmOpen}
        subscription={subscription}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function UpgradeStubModal({ open, onClose }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h2 className="text-base font-semibold text-text-primary">Upgrade plan</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Plan comparison is coming soon. For now, contact support to upgrade.
        </p>
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
