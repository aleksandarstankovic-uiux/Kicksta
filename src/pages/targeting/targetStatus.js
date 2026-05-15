// Shared copy for target status pills. Used by:
//   - TargetRow (Targeting page)
//   - TargetsOverviewBody (Overview Top Targets card)
//   - TargetDetailDrawer
//   - any future surface that surfaces a target's status
//
// The engine processes ONE target at a time. Exactly one target is
// "Active" (the runner); everything else in rotation is "Queued".
// The tooltip strings make that explicit so users don't expect
// parallel processing.

export const STATUS_TOOLTIP = {
  active:
    'Currently running. The engine processes one target at a time — this is the one being worked on now.',
  queued:
    'In rotation. Will run when the active target depletes or is paused.',
  paused:
    "Engine isn't running on this target. Resume it from the detail panel to put it back in the queue.",
  depleted:
    'All available followers from this target have been processed. Add a new target to keep growing.',
  archived:
    'Removed from rotation. Restore from the Archive tab if you want to use it again.',
}
