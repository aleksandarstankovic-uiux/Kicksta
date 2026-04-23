import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  isAuthenticated: true,
  signupStep: null,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setSignupStep: (step) => set({ signupStep: step }),
}))
