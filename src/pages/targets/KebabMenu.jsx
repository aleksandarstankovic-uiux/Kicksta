import { useEffect } from 'react'
import { Pause, Play, Trash2 } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Status-aware action menu opened by row tap or kebab click.
// Mobile: bottom sheet. Desktop: centered lightweight popover (the
// anchored-to-row variant is a polish task we can layer on later —
// the functional UX here is identical).
export default function KebabMenu({ target, onClose, onRequestRemove }) {
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!target) return null

  const items = buildItems(target, {
    pause: () => {
      pauseTarget(target.id)
      onClose()
    },
    resume: () => {
      resumeTarget(target.id)
      onClose()
    },
    remove: () => {
      onRequestRemove(target)
    },
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Actions for ${target.value}`}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden rounded-t-xl bg-surface shadow-xl lg:max-w-xs lg:rounded-xl"
      >
        {/* Header — names the target so the user confirms they're acting
            on the right row before tapping Remove. */}
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-text-primary">
            {target.value}
          </p>
        </div>

        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                onClick={it.onClick}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm ${
                  it.destructive
                    ? 'text-red-text hover:bg-red-tint'
                    : 'text-text-primary hover:bg-bg'
                }`}
              >
                <it.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function buildItems(target, { pause, resume, remove }) {
  const removeItem = { label: 'Remove', icon: Trash2, onClick: remove, destructive: true }
  switch (target.status) {
    case 'active':
      return [
        { label: 'Pause', icon: Pause, onClick: pause },
        removeItem,
      ]
    case 'paused':
      return [
        { label: 'Resume', icon: Play, onClick: resume },
        removeItem,
      ]
    case 'queued':
    case 'depleted':
    default:
      return [removeItem]
  }
}
