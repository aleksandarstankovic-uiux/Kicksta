import { create } from 'zustand'
import { mockTargets } from '@/mocks/targets'

// Single source of truth for the Targets page. Actions are synchronous
// and optimistic — real API wiring can replace the bodies later without
// changing the store's shape.
//
// Filter buckets mirror the target status values plus an "all" shortcut.
// Sort modes are explicit so the UI can show the current choice.

const nextId = () => `t_${Math.random().toString(36).slice(2, 8)}`

export const useTargetsStore = create((set) => ({
  targets: mockTargets,
  filter: 'all',
  sort: 'priority',

  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),

  addTarget: ({ type, value }) =>
    set((state) => ({
      targets: [
        {
          id: nextId(),
          type,
          value,
          status: 'queued',
          followedCount: 0,
          followBackCount: 0,
          addedAt: new Date().toISOString(),
        },
        ...state.targets,
      ],
    })),

  pauseTarget: (id) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, status: 'paused' } : t
      ),
    })),

  resumeTarget: (id) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, status: 'active' } : t
      ),
    })),

  removeTarget: (id) =>
    set((state) => ({
      targets: state.targets.filter((t) => t.id !== id),
    })),
}))

// Priority order used by the default sort — keeps actionable rows (active,
// queued) above rows the user has already dealt with (paused, depleted).
export const STATUS_PRIORITY = {
  active: 0,
  queued: 1,
  paused: 2,
  depleted: 3,
}

export function sortTargets(targets, sort) {
  const copy = targets.slice()
  switch (sort) {
    case 'followBacks':
      return copy.sort((a, b) => b.followBackCount - a.followBackCount)
    case 'recent':
      return copy.sort(
        (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
      )
    case 'alpha':
      return copy.sort((a, b) => a.value.localeCompare(b.value))
    case 'priority':
    default:
      return copy.sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 99
        const pb = STATUS_PRIORITY[b.status] ?? 99
        if (pa !== pb) return pa - pb
        return b.followBackCount - a.followBackCount
      })
  }
}

export function filterTargets(targets, filter) {
  if (filter === 'all') return targets
  return targets.filter((t) => t.status === filter)
}
