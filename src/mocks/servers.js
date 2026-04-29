// Server / region options for a subscription. The `id` is the
// canonical key stored on the subscription; `label` is the compact
// chip text and `region` is the longer descriptive label used in
// the picker modal.
export const mockServers = [
  { id: 'us-east', label: 'US-East', region: 'United States (East)' },
  { id: 'us-west', label: 'US-West', region: 'United States (West)' },
  { id: 'eu-west', label: 'EU-West', region: 'Europe (West)' },
  { id: 'ap-southeast', label: 'AP-Southeast', region: 'Asia-Pacific (Southeast)' },
]

export function findServer(id) {
  return mockServers.find((s) => s.id === id) ?? mockServers[0]
}
