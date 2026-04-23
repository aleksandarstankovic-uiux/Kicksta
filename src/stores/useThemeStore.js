import { create } from 'zustand'

const getInitialTheme = () => {
  const stored = localStorage.getItem('kicksta-theme')
  if (stored === 'light' || stored === 'dark') return stored
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

