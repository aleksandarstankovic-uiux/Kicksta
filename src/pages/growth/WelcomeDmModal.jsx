import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Modal for editing the Welcome DM message. Auto-saves on Save click;
// Cancel discards edits. Keeps the Engagement card fixed-height.
export default function WelcomeDmModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const storedMessage = useGrowthConfig((s) => s.config.welcomeDm.message)
  const setWelcomeDmMessage = useGrowthConfig((s) => s.setWelcomeDmMessage)
  const [draft, setDraft] = useState(storedMessage)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setDraft(storedMessage)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
    setTimeout(() => textareaRef.current?.focus(), 80)
  }, [open, storedMessage])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSave = () => {
    setWelcomeDmMessage(draft)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome DM message"
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
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Welcome DM message</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-text-secondary">
            Sent to new followers after they follow you back.
          </p>
          <textarea
            ref={textareaRef}
            rows={5}
            maxLength={200}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-3 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="mt-1 text-right text-xs text-text-muted">{draft.length}/200</div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-3 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
