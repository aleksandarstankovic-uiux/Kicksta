import { useEffect, useState } from 'react'
import { Mail, X } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

export default function EditEmailModal({ open, onClose }) {
  const profile = useUserProfile()
  const setEmail = useUserProfile((s) => s.setEmail)

  const [mounted, setMounted] = useState(false)
  const [email, setEmailDraft] = useState(profile.email)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setEmailDraft(profile.email)
    setError('')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, profile.email])

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setEmail(email)
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
              <Mail className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Edit email</h2>
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
            <span className="text-sm font-medium text-text-secondary">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmailDraft(e.target.value)
                setError('')
              }}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
            />
          </label>
          {error && <p className="text-xs text-red-text" role="alert">{error}</p>}
          <p className="text-xs text-text-muted">
            We'll send a verification link to the new address.
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
            Send verification
          </button>
        </div>
      </form>
    </div>
  )
}
