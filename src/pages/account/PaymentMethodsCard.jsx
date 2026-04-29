import { useEffect, useRef, useState } from 'react'
import { CreditCard, Plus, MoreHorizontal, Star, Pencil, Trash2, Layers } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { usePaymentMethods } from '@/stores/usePaymentMethods'
import { useSubscriptions } from '@/stores/useSubscriptions'
import EditPaymentModal from './EditPaymentModal'

const PLAN_PRICE = { growth: 29, advanced: 49 }

function brandLabel(brand) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card'
}

export default function PaymentMethodsCard() {
  const cards = usePaymentMethods((s) => s.cards)
  const setPrimary = usePaymentMethods((s) => s.setPrimary)
  const removeCard = usePaymentMethods((s) => s.removeCard)
  const subscriptions = useSubscriptions((s) => s.subscriptions)

  const [modalCardId, setModalCardId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const activeSubs = subscriptions.filter((s) => s.status !== 'canceled')
  const monthlyTotal = activeSubs.reduce(
    (sum, s) => sum + PLAN_PRICE[s.plan] + (s.growthPlus ? 10 : 0),
    0,
  )

  function openEdit(id) {
    setModalCardId(id)
    setModalOpen(true)
  }

  function openAdd() {
    setModalCardId(null)
    setModalOpen(true)
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="blue" icon={CreditCard} />
        <h2 className="text-lg font-semibold leading-snug text-text-primary">Payment method</h2>
        <InfoTooltip text="Cards on file for this account. The primary card is charged for every subscription." />
      </div>

      {/* Prominent usage summary — moved out of the small footer line */}
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-bg p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-text-secondary">
          <Layers className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <p className="text-sm font-medium text-text-primary">
            Used by {activeSubs.length} {activeSubs.length === 1 ? 'subscription' : 'subscriptions'}
          </p>
          <p className="text-sm font-semibold text-text-primary">${monthlyTotal}/mo total</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {cards.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            onEdit={() => openEdit(card.id)}
            onSetPrimary={() => setPrimary(card.id)}
            onRemove={() => removeCard(card.id)}
          />
        ))}
        <button
          onClick={openAdd}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg/40 text-sm font-medium text-text-secondary hover:border-blue-base hover:bg-blue-tint/40 hover:text-blue-text"
        >
          <Plus className="h-4 w-4" /> Add payment method
        </button>
      </ul>

      <EditPaymentModal
        open={modalOpen}
        cardId={modalCardId}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}

function CardRow({ card, onEdit, onSetPrimary, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
        <CreditCard className="h-5 w-5" />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-text-primary">
            {brandLabel(card.brand)} ending in {card.last4}
          </p>
          {card.primary && (
            <span className="inline-flex rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
              Primary
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary">
          Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
        </p>
      </div>
      <div ref={ref} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          aria-label="Card actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-11 z-20 w-48 rounded-lg border border-border bg-surface shadow-lg">
            {!card.primary && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onSetPrimary()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-bg"
              >
                <Star className="h-4 w-4" /> Set as primary
              </button>
            )}
            <button
              onClick={() => {
                setMenuOpen(false)
                onEdit()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-bg"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                onRemove()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-text hover:bg-red-tint"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
