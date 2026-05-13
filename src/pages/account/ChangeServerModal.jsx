import { useEffect, useMemo, useState } from 'react'
import { Globe, X } from 'lucide-react'
import {
  findCountry,
  findServer,
  mockServerCountries,
} from '@/mocks/servers'
import { useSubscriptions } from '@/stores/useSubscriptions'

// Two-step server picker. The user first chooses a country, then a
// city within that country. City list updates reactively when the
// country changes — defaults to the first city in the new country
// so the form is always in a saveable state.
//
// Save is disabled while the picked city matches the current server
// (no-op). Cancel always closes without writing.
export default function ChangeServerModal({ open, subscription, onClose }) {
  const [mounted, setMounted] = useState(false)
  const setServer = useSubscriptions((s) => s.setServer)

  const initialServer = subscription
    ? findServer(subscription.server)
    : null
  const [countryId, setCountryId] = useState(initialServer?.countryId ?? null)
  const [cityId, setCityId] = useState(initialServer?.id ?? null)

  const country = useMemo(() => (countryId ? findCountry(countryId) : null), [countryId])
  const cities = country?.cities ?? []

  useEffect(() => {
    if (!open) return
    setMounted(false)
    const s = findServer(subscription?.server)
    setCountryId(s?.countryId ?? null)
    setCityId(s?.id ?? null)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, subscription?.server])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !subscription) return null

  function handleCountryChange(newCountryId) {
    setCountryId(newCountryId)
    const next = findCountry(newCountryId)
    // Default to the first city of the new country so the form stays valid.
    setCityId(next?.cities?.[0]?.id ?? null)
  }

  function save() {
    if (cityId && cityId !== subscription.server) {
      setServer(subscription.id, cityId)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">
              Change server
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            Pick the country and city closest to your audience. Closer
            servers improve growth speed and Instagram safety.
          </p>

          <label
            htmlFor="server-country"
            className="mt-4 block text-xs font-medium text-text-secondary"
          >
            Country
          </label>
          <select
            id="server-country"
            value={countryId ?? ''}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
          >
            {mockServerCountries.map((c) => (
              <option key={c.countryId} value={c.countryId}>
                {c.country}
              </option>
            ))}
          </select>

          <label
            htmlFor="server-city"
            className="mt-4 block text-xs font-medium text-text-secondary"
          >
            City
          </label>
          <select
            id="server-city"
            value={cityId ?? ''}
            onChange={(e) => setCityId(e.target.value)}
            disabled={!country}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-text-primary focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.city}
              </option>
            ))}
          </select>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!cityId || cityId === subscription.server}
              className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
