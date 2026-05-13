// Server / region options for a subscription.
//
// Servers are flat objects keyed by `id`, but each carries a
// `countryId` + `country` + `city` so the picker UI can render a
// two-step country → city flow. `findServer(id)` returns the flat
// shape for any display surface that just needs to render the
// city/country pair.
//
// Backend-shipped: the real API exposes more cities; this list is
// representative for V1.
export const mockServers = [
  // United States
  { id: 'us-nyc', countryId: 'us', country: 'United States', city: 'New York' },
  { id: 'us-lax', countryId: 'us', country: 'United States', city: 'Los Angeles' },
  { id: 'us-chi', countryId: 'us', country: 'United States', city: 'Chicago' },
  { id: 'us-mia', countryId: 'us', country: 'United States', city: 'Miami' },
  // United Kingdom
  { id: 'uk-lon', countryId: 'uk', country: 'United Kingdom', city: 'London' },
  { id: 'uk-mcr', countryId: 'uk', country: 'United Kingdom', city: 'Manchester' },
  // Germany
  { id: 'de-fra', countryId: 'de', country: 'Germany', city: 'Frankfurt' },
  { id: 'de-ber', countryId: 'de', country: 'Germany', city: 'Berlin' },
  // Netherlands
  { id: 'nl-ams', countryId: 'nl', country: 'Netherlands', city: 'Amsterdam' },
  // Sweden
  { id: 'se-sto', countryId: 'se', country: 'Sweden', city: 'Stockholm' },
  // Singapore
  { id: 'sg-sin', countryId: 'sg', country: 'Singapore', city: 'Singapore' },
  // Japan
  { id: 'jp-tyo', countryId: 'jp', country: 'Japan', city: 'Tokyo' },
  // Australia
  { id: 'au-syd', countryId: 'au', country: 'Australia', city: 'Sydney' },
]

export function findServer(id) {
  return mockServers.find((s) => s.id === id) ?? mockServers[0]
}

// Country list derived from the flat server array. Each entry holds
// the cities available within that country. Used by the two-step
// picker UI.
export const mockServerCountries = (() => {
  const map = new Map()
  for (const s of mockServers) {
    if (!map.has(s.countryId)) {
      map.set(s.countryId, {
        countryId: s.countryId,
        country: s.country,
        cities: [],
      })
    }
    map.get(s.countryId).cities.push(s)
  }
  return Array.from(map.values())
})()

export function findCountry(countryId) {
  return mockServerCountries.find((c) => c.countryId === countryId) ?? null
}
