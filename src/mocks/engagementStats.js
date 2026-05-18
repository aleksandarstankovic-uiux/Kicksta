// All-time engagement totals for the stats hero on /engagement.
// Cumulative numbers since the account subscribed — accumulate over
// time so the trend is always positive (we display weekly growth).
//
// `current` = the cumulative value. `delta` = the change added in
// the last 7 days (always positive for cumulative metrics).
export const mockEngagementStats = {
  dmsSent: { current: 1_284, delta: 47 },
  dmOpenRate: { current: 68, delta: 4 },
  closeFriends: { current: 412, delta: 23 },
}
