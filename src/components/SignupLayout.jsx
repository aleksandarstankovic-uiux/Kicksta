import { useState, createContext, useContext, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Eye, EyeOff, LogOut } from 'lucide-react'
import kickstaFullLogo from '@/assets/kicksta-full-logo.svg'

// Context to let child pages signal that the user has unsaved input
const DirtyFormContext = createContext({ isDirty: false, setDirty: () => {} })
export function useDirtyForm() { return useContext(DirtyFormContext) }

// Context to let child pages read whether heading icons are visible (temp toggle)
const HeadingIconContext = createContext(true)
export function useShowHeadingIcon() { return useContext(HeadingIconContext) }

// All routes in order (for back navigation)
const SIGNUP_STEPS = [
  '/signup/ig-preview',
  '/signup/plan-selection',
  '/signup/billing',
  '/signup/connect-instagram',
  '/signup/two-factor',
  '/signup/two-factor/sms',
  '/signup/two-factor/auth_app',
  '/signup/two-factor/whatsapp',
  '/signup/first-target',
  '/signup/growth-plus',
  '/signup/dashboard-entry',
]

// Bundled visual steps — routes map to a displayed step index
const DISPLAYED_STEPS = [
  { label: 'Account', routes: ['/signup/ig-preview'] },
  { label: 'Plan', routes: ['/signup/plan-selection', '/signup/billing'] },
  { label: 'Connect', routes: ['/signup/connect-instagram', '/signup/two-factor', '/signup/two-factor/sms', '/signup/two-factor/auth_app', '/signup/two-factor/whatsapp'] },
  { label: 'Finish', routes: ['/signup/first-target', '/signup/growth-plus', '/signup/dashboard-entry'] },
]

function getDisplayedStepIndex(pathname) {
  for (let i = 0; i < DISPLAYED_STEPS.length; i++) {
    if (DISPLAYED_STEPS[i].routes.includes(pathname)) return i
  }
  return -1
}

// Routes where the back button should be hidden
const HIDE_BACK_ROUTES = [
  '/signup/connect-instagram',
  '/signup/first-target',
  '/signup/growth-plus',
]

// Human-readable labels for back navigation
const STEP_LABELS = {
  '/signup/ig-preview': 'Account',
  '/signup/plan-selection': 'Plan Selection',
  '/signup/billing': 'Billing',
  '/signup/connect-instagram': 'Connect Instagram',
  '/signup/two-factor': 'Two-Factor Auth',
  '/signup/two-factor/sms': 'Two-Factor Auth',
  '/signup/two-factor/auth_app': 'Two-Factor Auth',
  '/signup/two-factor/whatsapp': 'Two-Factor Auth',
  '/signup/first-target': 'Targets',
  '/signup/growth-plus': 'Growth+',
  '/signup/dashboard-entry': 'Dashboard',
}

export default function SignupLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isDirty, setIsDirty] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)
  const [showHeadingIcons, setShowHeadingIcons] = useState(true)
  const routeIndex = SIGNUP_STEPS.indexOf(location.pathname)
  const displayIndex = getDisplayedStepIndex(location.pathname)
  const canGoBack = routeIndex > 0 && !HIDE_BACK_ROUTES.includes(location.pathname)
  const showStepper = displayIndex >= 0

  // Reset dirty state on route change
  const setDirty = useCallback((val) => setIsDirty(val), [])

  function doNavigateBack(target) {
    setIsDirty(false)
    setShowBackConfirm(false)
    navigate(target)
  }

  function handleBack() {
    if (!canGoBack) return
    const target = SIGNUP_STEPS[routeIndex - 1]
    if (isDirty) {
      setShowBackConfirm(true)
    } else {
      navigate(target)
    }
  }

  // Temp: navigate back regardless of HIDE_BACK_ROUTES (for testing)
  function handleTempBack() {
    if (routeIndex > 0) {
      const target = SIGNUP_STEPS[routeIndex - 1]
      if (isDirty) {
        setShowBackConfirm(true)
      } else {
        navigate(target)
      }
    }
  }

  return (
    <DirtyFormContext.Provider value={{ isDirty, setDirty }}>
    <HeadingIconContext.Provider value={showHeadingIcons}>
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-surface">
        <div className="grid h-14 grid-cols-3 items-center px-4 md:px-6">
          {/* Left — back button (mobile only) · logo (desktop) */}
          <div className="flex items-center gap-2">
            <img src={kickstaFullLogo} alt="Kicksta" className="hidden h-6 lg:block" />
            {canGoBack && (
              <button
                onClick={handleBack}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg hover:text-text-primary lg:hidden"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Center — logo on mobile, stepper on desktop */}
          <div className="flex items-center justify-center">
            <img src={kickstaFullLogo} alt="Kicksta" className="h-6 lg:hidden" />
            {showStepper && (
              <div className="hidden items-center gap-1.5 rounded-full bg-bg px-2.5 py-1.5 ring-1 ring-border lg:inline-flex">
                {DISPLAYED_STEPS.map((step, i) => {
                  const isCompleted = i < displayIndex
                  const isCurrent = i === displayIndex
                  return (
                    <div key={i} className="flex items-center gap-1.5">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                          isCompleted || isCurrent
                            ? 'bg-blue-base text-white'
                            : 'bg-surface text-text-muted'
                        }`}
                      >
                        {isCompleted ? (
                          <svg className="h-2.5 w-2.5" viewBox="0 0 14 14" fill="none">
                            <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={`text-xs ${
                          isCurrent
                            ? 'font-medium text-text-primary'
                            : isCompleted
                              ? 'font-medium text-blue-text'
                              : 'text-text-muted'
                        }`}
                      >
                        {step.label}
                      </span>
                      {i < DISPLAYED_STEPS.length - 1 && (
                        <div className={`h-px w-3 ${isCompleted ? 'bg-blue-base' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right — logout + temp buttons */}
          <div className="flex items-center justify-end gap-2">
            {/* TEMP: always-visible back button for testing */}
            {routeIndex > 0 && (
              <button
                onClick={handleTempBack}
                className="flex h-7 w-7 items-center justify-center rounded-md bg-red-tint text-red-text transition-colors hover:bg-red-base hover:text-white"
                aria-label="Go back (test)"
                title="Temp back — for testing"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {/* TEMP: toggle heading icons */}
            <button
              onClick={() => setShowHeadingIcons((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-yellow-tint text-yellow-text transition-colors hover:bg-yellow-base hover:text-white"
              aria-label="Toggle heading icons"
              title={`Heading icons: ${showHeadingIcons ? 'ON' : 'OFF'}`}
            >
              {showHeadingIcons ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
            {/* Logout */}
            <button
              onClick={() => {}}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              aria-label="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop back link — below header, left-aligned */}
      {canGoBack && (
        <div className="hidden px-6 pt-4 lg:block">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {STEP_LABELS[SIGNUP_STEPS[routeIndex - 1]] || 'Back'}
          </button>
        </div>
      )}

      {/* Mobile stepper — outside header */}
      {showStepper && (
        <div className="flex shrink-0 items-center justify-center px-4 py-2.5 lg:hidden">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 ring-1 ring-border">
            {DISPLAYED_STEPS.map((step, i) => {
              const isCompleted = i < displayIndex
              const isCurrent = i === displayIndex
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      isCompleted || isCurrent
                        ? 'bg-blue-base text-white'
                        : 'bg-bg text-text-muted'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-2.5 w-2.5" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-medium text-text-primary">
                      {step.label}
                    </span>
                  )}
                  {i < DISPLAYED_STEPS.length - 1 && (
                    <div className={`h-px w-3 ${isCompleted ? 'bg-blue-base' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <main className="flex flex-1 flex-col items-center px-6 pt-6 pb-6 md:justify-center md:px-8 md:pt-6 md:pb-8">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </main>

      {/* Back confirmation — drawer on mobile, centered modal on desktop */}
      {showBackConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBackConfirm(false) }}
        >
          <div
            className="w-full rounded-t-xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl lg:mx-4 lg:max-w-sm lg:rounded-xl lg:pb-6"
            style={{ animation: window.innerWidth < 1024 ? 'drawerSlideUp 0.3s ease-out' : 'fadeSlideIn 0.25s ease-out' }}
          >
            <div className="flex flex-col items-center text-center">
              {/* Drawer handle — mobile only */}
              <div className="mb-4 h-1 w-10 rounded-full bg-border lg:hidden" />

              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-tint">
                <AlertTriangle className="h-6 w-6 text-yellow-text" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Leave this page?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                You have unsaved changes that will be lost if you go back.
              </p>
              <div className="mt-4 flex w-full flex-col gap-4">
                <button
                  onClick={() => doNavigateBack(SIGNUP_STEPS[routeIndex - 1])}
                  className="flex h-12 w-full items-center justify-center rounded-lg bg-red-base text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Leave page
                </button>
                <button
                  onClick={() => setShowBackConfirm(false)}
                  className="flex h-12 w-full items-center justify-center rounded-lg text-base font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Stay on this page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </HeadingIconContext.Provider>
    </DirtyFormContext.Provider>
  )
}
