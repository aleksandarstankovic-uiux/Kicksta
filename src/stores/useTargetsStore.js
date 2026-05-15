import { create } from 'zustand'
import { mockTargets } from '@/mocks/targets'

// Single source of truth for the Targets page. Actions are synchronous
// and optimistic — real API wiring can replace the bodies later without
// changing the store's shape.
//
// Filter buckets are 'active' (active + queued + paused + depleted —
// anything still in rotation) and 'archived' (removed targets,
// kept around so the user can restore them).
//
// `removeTarget` archives instead of hard-deleting, mirroring how
// most dashboards treat "Delete" — soft delete, restorable, but
// hidden from the default Active view.

const nextId = () => `t_${Math.random().toString(36).slice(2, 8)}`

export const useTargetsStore = create((set) => ({
  targets: mockTargets,
  // V1 mock: id of the target the engine is "currently working on".
  // Read by TargetRow to render a pulse halo on the active row's
  // status pill / mobile dot. Real engine wiring will replace this
  // initial pick with a server-driven value.
  processingId: mockTargets.find((t) => t.status === 'active')?.id ?? null,
  filter: 'active',
  sort: 'priority',

  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),

  addTarget: ({
    type,
    value,
    followers,
    posts,
    profilePic,
    verified,
    isPrivate,
  }) =>
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
          // Optional source-of-truth fields. When a target is picked
          // via typeahead / suggestion, these come from the matched
          // record so the new row reads identically to the picker
          // (avatar, follower count, verified / private flags).
          followers,
          posts,
          profilePic,
          verified,
          // store as `private` so the existing target shape is
          // consistent with the matched-record shape (`private`
          // is reserved in some contexts as a destructured name,
          // not as a property name).
          private: isPrivate,
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

  // Soft-delete: flip status to 'archived'. Targets stay in the
  // store so the user can restore them from the Archived bucket.
  removeTarget: (id) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, status: 'archived' } : t,
      ),
    })),

  // Restore an archived target back to 'queued' so it re-enters
  // rotation on the user's next pass.
  restoreTarget: (id) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, status: 'queued' } : t,
      ),
    })),
}))

// Priority order used by the default sort — keeps actionable rows (active,
// queued) above rows the user has already dealt with (paused, depleted),
// with archived rows always last.
export const STATUS_PRIORITY = {
  active: 0,
  queued: 1,
  paused: 2,
  depleted: 3,
  archived: 4,
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
  if (filter === 'archived') return targets.filter((t) => t.status === 'archived')
  // Active bucket = anything still in rotation (i.e. not archived).
  return targets.filter((t) => t.status !== 'archived')
}
