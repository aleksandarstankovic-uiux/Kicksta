import { useEffect, useState } from 'react'
import { Phone, X } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

export default function EditPhoneModal({ open, onClose }) {
  const profile = useUserProfile()
  const setPhone = useUserProfile((s) => s.setPhone)

  const [mounted, setMounted] = useState(false)
  const [country, setCountry] = useState(profile.phoneCountry)
  const [number, setNumber] = useState(profile.phoneNumber ?? '')

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setCountry(profile.phoneCountry)
    setNumber(profile.phoneNumber ?? '')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, profile.phoneCountry, profile.phoneNumber])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleSubmit(e) {
    e.preventDefault()
    setPhone({ country, number })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Phone className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Edit phone number</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">Phone</span>
            <div className="flex gap-2">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-10 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary focus:border-blue-base focus:outline-none"
              >
                <option value="US">US +1</option>
                <option value="GB">GB +44</option>
                <option value="DE">DE +49</option>
                <option value="FR">FR +33</option>
                <option value="AU">AU +61</option>
              </select>
              <input
                type="tel"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="555 123 4567"
                className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
              />
            </div>
          </label>
          <p className="text-xs text-text-muted">
            Leave empty and save to remove your phone number.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Save phone number
          </button>
        </div>
      </form>
    </div>
  )
}
