import { create } from 'zustand'

// Initial theme priority: a previously-stored explicit choice wins;
// otherwise we honor the OS-level `prefers-color-scheme` (per
// CLAUDE.md). Server-side / SSR fallback returns 'light' since
// `window.matchMedia` isn't available there.
const getInitialTheme = () => {
  const stored = localStorage.getItem('kicksta-theme')
  if (stored === 'light' || stored === 'dark') return stored
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('kicksta-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
      return { theme: next }
    }),
  setTheme: (theme) => {
    localStorage.setItem('kicksta-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    set({ theme })
  },
}))

