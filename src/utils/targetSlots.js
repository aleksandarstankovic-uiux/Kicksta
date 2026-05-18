import { mockUser } from '@/mocks/user'

// Plan-derived target slot limit. Source of truth — anywhere the
// dashboard enforces "you can't have more than N targets in rotation"
// should call this. Pulled out of TargetsHeroCard so RestoreLimitModal
// can reuse it without importing UI.
export function slotLimit() {
  return mockUser.plan === 'advanced' ? 30 : 10
}

// Count of targets that occupy a rotation slot. Archived targets
// don't count — they're out of rotation until restored.
export function inRotationCount(targets) {
  return targets.filter((t) => t.status !== 'archived').length
}
