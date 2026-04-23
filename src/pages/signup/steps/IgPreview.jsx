import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AtSign, Users, UserPlus, Grid3X3, Camera, Info, Loader2, ShieldCheck, Lock, Eye, SearchX, AlertTriangle } from 'lucide-react'
import { cn, formatNumber } from '@/lib/utils'
import { useShowHeadingIcon } from '@/components/SignupLayout'

// Simulated search results
const mockSearchResults = [
  { username: 'alexjohnson.co', fullName: 'Alex Johnson', profilePic: '/mock-avatar.svg', followers: 4832, following: 1247, posts: 312, isPrivate: false },
  { username: 'alexjohnson_fit', fullName: 'Alex Johnson Fitness', profilePic: null, followers: 12400, following: 890, posts: 548, isPrivate: true },
  { username: 'alex.johnson.nyc', fullName: 'Alex J.', profilePic: null, followers: 2100, following: 430, posts: 87, isPrivate: false },
]

export default function IgPreview() {
  const navigate = useNavigate()
  const showIcon = useShowHeadingIcon()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [noResults, setNoResults] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [profile, setProfile] = useState(null)
  const [continuing, setContinuing] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [viewTransition, setViewTransition] = useState('search') // 'search' | 'confirm'
  const debounceRef = useRef(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-focus input on mount
  useEffect(() => {
    if (!profile && inputRef.current) {
      inputRef.current.focus()
    }
  }, [profile])

  // Debounced search as user types
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim().replace(/^@/, '')
    if (trimmed.length < 2) {
      setResults([])
      setShowResults(false)
      setSearching(false)
      setNoResults(false)
      return
    }

    setSearching(true)
    setNoResults(false)
    debounceRef.current = setTimeout(() => {
      const filtered = mockSearchResults.filter(
        (r) => r.username.includes(trimmed.toLowerCase()) || r.fullName.toLowerCase().includes(trimmed.toLowerCase())
      )
      setResults(filtered)
      setShowResults(true)
      setSearching(false)
      setNoResults(filtered.length === 0)
      setHighlightIndex(-1)
    }, 600)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function selectResult(result) {
    setViewTransition('confirm')
    // Small delay to let the fade-out start before swapping content
    setTimeout(() => {
      setProfile(result)
      setShowResults(false)
      setQuery(result.username)
    }, 150)
  }

  function handleContinue() {
    setContinuing(true)
    setTimeout(() => {
      navigate('/signup/plan-selection')
    }, 400)
  }

  function handleSubmit(e) {
    e.preventDefault()
    // If exactly one result, auto-select it
    if (results.length === 1) {
      selectResult(results[0])
      return
    }
    // If highlight is active, select that result
    if (highlightIndex >= 0 && results[highlightIndex]) {
      selectResult(results[highlightIndex])
      return
    }
    if (!query.trim()) {
      setError('Enter your Instagram username')
    }
  }

  function handleKeyDown(e) {
    if (!showResults || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Escape') {
      setShowResults(false)
      setHighlightIndex(-1)
    }
  }

  function handleReset() {
    setViewTransition('search')
    setTimeout(() => {
      setProfile(null)
      setQuery('')
      setResults([])
      setNoResults(false)
      setContinuing(false)
      setHighlightIndex(-1)
    }, 150)
  }

  // Confirmation view — profile selected
  if (profile) {
    return (
      <div
        className="mx-auto w-full max-w-md"
        style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
      >
        <div className="mb-4 text-center lg:mb-6">
          <h1 className="text-2xl font-semibold leading-snug text-text-primary">
            Is this your account?
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
            Confirm this is the Instagram account you want to grow.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
            {/* Profile header */}
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-tint">
                {profile.profilePic ? (
                  <img
                    src={profile.profilePic}
                    alt={profile.username}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <Camera className="h-7 w-7 text-blue-text" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-base font-semibold text-text-primary">
                    @{profile.username}
                  </p>
                  {profile.isPrivate && (
                    <Lock className="h-4 w-4 shrink-0 text-yellow-text" />
                  )}
                </div>
                <p className="mt-1 truncate text-sm text-text-secondary">
                  {profile.fullName}
                </p>
              </div>
            </div>

            {/* Private account warning */}
            {profile.isPrivate && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-yellow-tint px-3.5 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-text" />
                <p className="text-xs leading-relaxed text-yellow-text">
                  Private accounts limit Kicksta's ability to grow your audience. We recommend switching to a public profile for the best results.
                </p>
              </div>
            )}

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1 rounded-lg bg-bg px-2 py-3">
                <Grid3X3 className="h-4 w-4 text-text-muted" />
                <span className="text-lg font-semibold text-text-primary">
                  {formatNumber(profile.posts)}
                </span>
                <span className="text-xs text-text-secondary">Posts</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-bg px-2 py-3">
                <Users className="h-4 w-4 text-text-muted" />
                <span className="text-lg font-semibold text-text-primary">
                  {formatNumber(profile.followers)}
                </span>
                <span className="text-xs text-text-secondary">Followers</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-lg bg-bg px-2 py-3">
                <UserPlus className="h-4 w-4 text-text-muted" />
                <span className="text-lg font-semibold text-text-primary">
                  {formatNumber(profile.following)}
                </span>
                <span className="text-xs text-text-secondary">Following</span>
              </div>
            </div>
          </div>

          {/* Signpost */}
          <div className="flex items-center justify-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-blue-base" />
            <p className="text-sm leading-relaxed text-text-muted">
              You'll connect your Instagram after choosing your plan.
            </p>
          </div>

          {/* Confirm */}
          <button
            onClick={handleContinue}
            disabled={continuing}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
          >
            {continuing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Continuing...
              </>
            ) : (
              'Yes, continue'
            )}
          </button>

          {/* Change selection */}
          <button
            onClick={handleReset}
            disabled={continuing}
            className="flex h-11 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary disabled:opacity-50"
          >
            Search again
          </button>
        </div>
      </div>
    )
  }

  // Search view — no profile selected
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-md transition-all duration-300',
        viewTransition === 'search' && !profile ? 'opacity-100' : ''
      )}
      style={viewTransition === 'search' ? { animation: 'fadeSlideIn 0.3s ease-out' } : undefined}
    >
      <div className="mb-4 text-center lg:mb-6">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
            <AtSign className="h-6 w-6 text-blue-text" />
          </div>
        )}
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Find your Instagram
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
          Enter your username so we can personalize your experience.
        </p>
      </div>

      <form onSubmit={handleSubmit} ref={containerRef} className="relative">
        <div className="relative">
          <AtSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-text-muted" />
          )}
          <input
            ref={inputRef}
            id="ig-username"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            value={query}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setQuery(e.target.value)
              if (error) setError('')
            }}
            placeholder="Search username"
            className={cn(
              'h-12 w-full rounded-lg border bg-surface pl-12 pr-12 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
              error ? 'border-red-base' : 'border-border'
            )}
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-text">{error}</p>}

        {/* Empty state hint */}
        {!showResults && !searching && query.length === 0 && (
          <p className="mt-3 text-center text-xs text-text-muted">
            Try your Instagram handle, e.g. @yourname
          </p>
        )}

        {/* No results found */}
        {showResults && noResults && !searching && (
          <div className="absolute inset-x-0 top-14 z-10 flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 shadow-xl">
            <SearchX className="h-6 w-6 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">No accounts found</p>
            <p className="text-xs text-text-secondary">Check the spelling and try again.</p>
          </div>
        )}

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <ul className="absolute inset-x-0 top-14 z-10 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            {results.map((result, index) => (
              <li key={result.username}>
                <button
                  type="button"
                  onClick={() => selectResult(result)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                    highlightIndex === index ? 'bg-blue-tint' : 'hover:bg-bg'
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint">
                    {result.profilePic ? (
                      <img src={result.profilePic} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <Camera className="h-4 w-4 text-blue-text" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-sm font-medium text-text-primary">@{result.username}</p>
                      {result.isPrivate && <Lock className="h-3 w-3 shrink-0 text-yellow-text" />}
                    </div>
                    <p className="truncate text-xs text-text-secondary">{result.fullName}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Trust signals */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1.5 text-xs font-medium text-green-text">
          <ShieldCheck className="h-3.5 w-3.5" />
          Safe & secure
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1.5 text-xs font-medium text-green-text">
          <Lock className="h-3.5 w-3.5" />
          Encrypted
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1.5 text-xs font-medium text-green-text">
          <Eye className="h-3.5 w-3.5" />
          Public info only
        </span>
      </div>
    </div>
  )
}
