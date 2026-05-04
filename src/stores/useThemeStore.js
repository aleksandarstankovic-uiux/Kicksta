import { create } from 'zustand'

// Initial theme: stored explicit choice wins; otherwise default to
// 'light'. (We previously honored `prefers-color-scheme` here but
// reverted because the OS default flipped users into dark mode in
// preview environments without warning.)
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

