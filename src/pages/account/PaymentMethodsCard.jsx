import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, Plus, MoreHorizontal, Star, Pencil, Trash2, X } from 'lucide-react'
import CardChip from '@/components/CardChip'
import CardBrandIcon from '@/components/CardBrandIcon'
import InfoTooltip from '@/components/InfoTooltip'
import { usePaymentMethods } from '@/stores/usePaymentMethods'
import EditPaymentModal from './EditPaymentModal'

function brandLabel(brand) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card'
}

export default function PaymentMethodsCard() {
  const cards = usePaymentMethods((s) => s.cards)
  const setPrimary = usePaymentMethods((s) => s.setPrimary)
  const removeCard = usePaymentMethods((s) => s.removeCard)

  const [modalCardId, setModalCardId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionsCardId, setActionsCardId] = useState(null)

  function openEdit(id) {
    setModalCardId(id)
    setModalOpen(true)
  }

  function openAdd() {
    setModalCardId(null)
    setModalOpen(true)
  }

  const actionsCard = actionsCardId
    ? cards.find((c) => c.id === actionsCardId)
    : null

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      {/* Section header lives INSIDE the card — chip + title + tooltip
          on the left, Add card pinned right. Matches the ProfilePanel
          card recipe one tab over so Settings reads as a coherent
          surface. */}
      <div className="flex flex-wrap items-center gap-2">
        <CardChip color="blue" icon={CreditCard} />
        <h2 className="min-w-0 truncate text-base font-semibold text-text-primary">
          Payment methods
        </h2>
        <InfoTooltip text="Cards on file for this account. The primary card is charged for every subscription." />
        <button
          onClick={openAdd}
          aria-label="Add card"
          className="ml-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add card</span>
        </button>
      </div>

      <ul className="mt-4 flex flex-col">
        {cards.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            onOpenActions={() => setActionsCardId(card.id)}
          />
        ))}
      </ul>

      <EditPaymentModal
        open={modalOpen}
        cardId={modalCardId}
        onClose={() => setModalOpen(false)}
      />

      <CardActionsSheet
        card={actionsCard}
        onClose={() => setActionsCardId(null)}
        onSetPrimary={() => setPrimary(actionsCardId)}
        onEdit={() => openEdit(actionsCardId)}
        onRemove={() => removeCard(actionsCardId)}
      />
    </section>
  )
}

function CardRow({ card, onOpenActions }) {
  const isPrimary = card.primary
  const rowCls = isPrimary
    ? 'rounded-lg border border-blue-base bg-blue-tint/40 shadow-sm p-3 mb-1'
    : 'py-3 border-b border-border last:border-b-0 last:pb-0'
  const chipCls = isPrimary
    ? 'bg-blue-base text-white'
    : 'bg-bg text-text-secondary'

  return (
    <li className={`flex items-center gap-3 ${rowCls}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${chipCls}`}>
        <CardBrandIcon brand={card.brand} className="h-5 w-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-text-primary">
            {brandLabel(card.brand)} ending in {card.last4}
          </p>
          {card.primary && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-base px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Star className="h-3 w-3" aria-hidden="true" /> Primary
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary">
          Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
        </p>
      </div>
      <button
        onClick={onOpenActions}
        className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
        aria-label={`Actions for ${brandLabel(card.brand)} ending in ${card.last4}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </li>
  )
}

// Card-actions sheet. Bottom drawer on mobile, centered modal on
// desktop — same shell as EditPaymentModal so the two share visual
// identity. Header repeats the card identity so the user sees which
// card they're acting on (the original inline dropdown didn't).
function CardActionsSheet({ card, onClose, onSetPrimary, onEdit, onRemove }) {
  const open = !!card

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center lg:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full overflow-hidden rounded-t-2xl border border-border bg-surface pb-[calc(env(safe-area-inset-bottom))] shadow-xl lg:max-w-sm lg:rounded-2xl lg:pb-0">
        {/* Header — card preview + close. The preview matches the
            visual identity of the row itself, so it's obvious which
            card the actions apply to. */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg text-text-secondary">
            <CardBrandIcon brand={card.brand} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">
                {brandLabel(card.brand)} ending in {card.last4}
              </p>
              {card.primary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-base px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <Star className="h-3 w-3" aria-hidden="true" /> Primary
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary">
              Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action list — tall enough for thumb targets. Set as primary
            and Remove only render when applicable (primary can't be
            removed, and is already primary so can't be set again). */}
        <div className="flex flex-col py-2">
          {!card.primary && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onSetPrimary()
              }}
              className="flex h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-text-primary hover:bg-bg"
            >
              <Star className="h-4 w-4 text-text-secondary" />
              Set as primary
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onClose()
              onEdit()
            }}
            className="flex h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-text-primary hover:bg-bg"
          >
            <Pencil className="h-4 w-4 text-text-secondary" />
            Edit
          </button>
          {!card.primary && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onRemove()
              }}
              className="flex h-12 w-full items-center gap-3 px-5 text-left text-sm font-medium text-red-text hover:bg-red-tint"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
