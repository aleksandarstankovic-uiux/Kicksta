import { create } from 'zustand'

// V1 override flag for the user's Growth+ subscription state. Starts
// `null` (consumers use mockUser.growthPlusSubscribed as the default).
// Flipped to `true` when the subscribe modal completes its success step
// on the Growth+ page; lets the dashboard re-render inline without
// mutating the mock data.
//
// Consumer pattern:
//   const subscribed = useGrowthPlusSubscription(
//     (s) => s.subscribed ?? mockUser.growthPlusSubscribed,
//   )
//
// In production: subscription state is per-IG-account via
// useSubscriptions[].growthPlus; this store goes away.
export const useGrowthPlusSubscription = create((set) => ({
  subscribed: null,
  markSubscribed: () => set({ subscribed: true }),
}))
