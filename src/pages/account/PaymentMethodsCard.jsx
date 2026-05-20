import { useEffect, useRef, useState } from 'react'
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

// Match the Tailwind `md:` breakpoint (768px). Used to pick between the
// inline desktop dropdown and the portal-rendered mobile bottom drawer
// for the per-card action menu.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 767px)').matches
  })
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    function onChange(e) {
      setIsMobile(e.matches)
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

export default function PaymentMethodsCard() {
  const cards = usePaymentMethods((s) => s.cards)
  const setPrimary = usePaymentMethods((s) => s.setPrimary)
  const removeCard = usePaymentMethods((s) => s.removeCard)

  const [modalCardId, setModalCardId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  function openEdit(id) {
    setModalCardId(id)
    setModalOpen(true)
  }

  function openAdd() {
    setModalCardId(null)
    setModalOpen(true)
  }

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
            onSetPrimary={() => setPrimary(card.id)}
            onEdit={() => openEdit(card.id)}
            onRemove={() => removeCard(card.id)}
          />
        ))}
      </ul>

      <EditPaymentModal
        open={modalOpen}
        cardId={modalCardId}
        onClose={() => setModalOpen(false)}
      />
    </section>
  )
}

// Row + its action menu. Mobile opens a bottom drawer (portal-rendered
// so it escapes any overflow ancestors); desktop opens an inline
// dropdown anchored to the trigger button. The trigger and menuOpen
// state are shared — only the UI surface changes per viewport.
function CardRow({ card, onSetPrimary, onEdit, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)
  const isMobile = useIsMobile()

  // Desktop dropdown: close on outside click. The mobile drawer handles
  // its own dismissal (backdrop click + ESC) so we only need this on
  // desktop.
  useEffect(() => {
    if (isMobile) return
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen, isMobile])

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
      <div ref={ref} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          aria-label={`Actions for ${brandLabel(card.brand)} ending in ${card.last4}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {/* Desktop: inline dropdown anchored to the trigger button. */}
        {menuOpen && !isMobile && (
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
            {!card.primary && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onRemove()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-text hover:bg-red-tint"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile: bottom drawer rendered via portal, gated by useIsMobile
          so it only mounts on viewports below the md breakpoint. */}
      {isMobile && (
        <CardActionsSheet
          open={menuOpen}
          card={card}
          onClose={() => setMenuOpen(false)}
          onSetPrimary={onSetPrimary}
          onEdit={onEdit}
          onRemove={onRemove}
        />
      )}
    </li>
  )
}

function CardActionsSheet({ open, card, onClose, onSetPrimary, onEdit, onRemove }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !card) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full overflow-hidden rounded-t-2xl border border-border bg-surface pb-[calc(env(safe-area-inset-bottom))] shadow-xl">
        {/* Header — card preview + close. Repeats the row's visual
            identity so the user is sure which card the actions apply
            to (the inline desktop dropdown is anchored to the row, so
            on desktop this isn't necessary; on mobile the drawer is
            detached from the row entirely). */}
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
