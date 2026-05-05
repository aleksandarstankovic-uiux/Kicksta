// Aggregate engagement metrics for the stats hero on /engagement.
// Static — no derivation from other mock files. When the engine wires
// up, this becomes a server-driven response.
//
// `current` is the value to display; `delta` is the change vs the
// previous comparable period (this-week vs last-week). Positive
// numbers render with ↑ in green; negative with ↓ in red.
export const mockEngagementStats = {
  dmsSent: { current: 47, delta: 15 },
  dmOpenRate: { current: 68, delta: 4 },
  closeFriends: { current: 23, delta: 5 },
}
