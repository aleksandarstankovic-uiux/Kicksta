// Top-3 numbers from the user's last weekly Instagram Audit. Surfaced
// directly on the Overview page so the audit card reads as a data card
// rather than a marketing card — the full PDF (downloadable via the CTA)
// keeps the rest. Numbers are mocked for V1; backend will own these.
//
// Deltas are signed strings ("+12%", "-3%") so the consumer can pick a
// tone (green / red / muted) without re-parsing the math.
export const mockAuditTopStats = {
  reach7d: {
    label: 'Profile reach',
    value: '12.4K',
    delta: '+18%',
    deltaTone: 'up', // 'up' | 'down' | 'flat'
  },
  engagementRate: {
    label: 'Engagement rate',
    value: '4.2%',
    delta: '+0.6pp',
    deltaTone: 'up',
  },
  avgLikes: {
    label: 'Avg likes / post',
    value: '287',
    delta: '-3%',
    deltaTone: 'down',
  },
}
