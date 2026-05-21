import { useEffect, useState } from 'react'
import { Lock, X } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

// Change-password modal. Validates: current required, new ≥ 8 chars,
// confirm must match new. Mock current is "password" — see store.
//
// Errors are scoped per-field via `errors.<field>` so the message
// renders directly under the field it relates to instead of as a
// single bottom-of-form line.
export default function PasswordModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const changePassword = useUserProfile((s) => s.changePassword)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setCurrent('')
    setNext('')
    setConfirm('')
    setErrors({})
    setBusy(false)
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

  async function handleSubmit(e) {
    e.preventDefault()
    // Validate every field up front and surface ALL errors so the
    // user sees each one underneath its own input on the first
    // submit, not one-at-a-time.
    const next_errors = {}
    if (!current) next_errors.current = 'Enter your current password.'
    if (!next) {
      next_errors.next = 'Enter a new password.'
    } else if (next.length < 8) {
      next_errors.next = 'New password must be at least 8 characters.'
    }
    if (!confirm) {
      next_errors.confirm = 'Re-enter your new password.'
    } else if (next && next !== confirm) {
      next_errors.confirm = 'Passwords do not match.'
    }
    if (Object.keys(next_errors).length > 0) {
      setErrors(next_errors)
      return
    }

    setErrors({})
    setBusy(true)
    const result = await changePassword({ current, next })
    setBusy(false)
    if (!result.ok) {
      // Backend rejection always relates to the current password
      // in V1 (mock store only validates `current`).
      setErrors({ current: result.error })
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-t-xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Lock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Change password</h2>
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
          <Field
            label="Current password"
            type="password"
            value={current}
            onChange={(v) => {
              setCurrent(v)
              if (errors.current) setErrors((p) => ({ ...p, current: undefined }))
            }}
            error={errors.current}
          />
          <Field
            label="New password"
            type="password"
            value={next}
            onChange={(v) => {
              setNext(v)
              if (errors.next) setErrors((p) => ({ ...p, next: undefined }))
            }}
            error={errors.next}
            hint="At least 8 characters."
          />
          <Field
            label="Confirm new password"
            type="password"
            value={confirm}
            onChange={(v) => {
              setConfirm(v)
              if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }))
            }}
            error={errors.confirm}
          />
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
            disabled={busy}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, type, value, onChange, hint, error }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={`h-10 rounded-lg border bg-surface px-3 text-sm text-text-primary focus:outline-none ${
          error ? 'border-red-base focus:border-red-base' : 'border-border focus:border-blue-base'
        }`}
      />
      {error ? (
        <span className="text-xs text-red-text" role="alert">{error}</span>
      ) : (
        hint && <span className="text-xs text-text-muted">{hint}</span>
      )}
    </label>
  )
}
