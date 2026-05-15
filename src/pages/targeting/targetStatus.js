// Shared copy for target status pills. Used by:
//   - TargetRow (Targeting page)
//   - TargetsOverviewBody (Overview Top Targets card)
//   - TargetDetailDrawer
//   - any future surface that surfaces a target's status
//
// The tooltip strings explain what each state means so users can
// understand why a target is paused, queued, or depleted without
// having to dig into the detail panel.

export const STATUS_TOOLTIP = {
  active:
    'The engine is currently following users from this target.',
  queued:
    'Waiting for an active slot. Will start once another target depletes or is paused.',
  paused:
    "Engine isn't running on this target. Resume it from the detail panel.",
  depleted:
    'All available followers have been processed. Add a new target to keep growing.',
  archived:
    'Removed from active rotation. Restore from the Archive tab if you want to use it again.',
}
