import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AtSign, Hash, Search, Loader2, X, Target, Sparkles, Ban, Globe, Crosshair, BarChart3, Users, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useShowHeadingIcon } from '@/components/SignupLayout'

const MAX_TARGETS = 10

const SUGGESTIONS = [
  { type: 'account', value: '@yoga.daily', followers: '890K', description: 'Yoga & mindfulness' },
  { type: 'account', value: '@blogilates', followers: '2.1M', description: 'Pilates & fitness' },
  { type: 'hashtag', value: '#gymlife', posts: '28M', description: 'Gym content' },
  { type: 'account', value: '@fitness.inspo', followers: '1.2M', description: 'Fitness & wellness' },
  { type: 'hashtag', value: '#homeworkouts', posts: '12M', description: 'Home fitness content' },
  { type: 'account', value: '@cleanfoodcrush', followers: '3.4M', description: 'Healthy recipes' },
  { type: 'hashtag', value: '#fitnessmotivation', posts: '45M', description: 'Fitness community' },
]

const MOCK_SEARCH_RESULTS = [
  { type: 'account', value: '@gym.shark', followers: '6.2M', description: 'Fitness apparel' },
  { type: 'account', value: '@blogilates', followers: '2.1M', description: 'Pilates & fitness' },
  { type: 'hashtag', value: '#gymlife', posts: '28M', description: 'Gym content' },
  { type: 'account', value: '@kayla_itsines', followers: '15M', description: 'Fitness programs' },
  { type: 'hashtag', value: '#healthylifestyle', posts: '52M', description: 'Health & wellness' },
]

const TIPS = [
  {
    icon: Ban,
    title: 'Avoid huge hashtags',
    body: 'Hashtags with 50M+ posts attract bots and spam accounts. Stick to niche hashtags under 10M for better quality followers.',
  },
  {
    icon: Globe,
    title: 'Use public accounts',
    body: 'Kicksta can only engage with followers of public accounts. Private account targets won\'t generate any growth.',
  },
  {
    icon: Crosshair,
    title: 'Pick accounts in your niche',
    body: 'Target accounts whose followers would genuinely care about your content. Relevance beats size every time.',
  },
  {
    icon: BarChart3,
    title: 'Mix accounts and hashtags',
    body: 'Combining both gives Kicksta a wider pool of potential followers and leads to more consistent daily growth.',
  },
  {
    icon: Users,
    title: 'Target engaged audiences',
    body: 'Accounts with active comments and likes tend to have followers who actually engage — not just scroll past.',
  },
]

export default function FirstTarget() {
  const navigate = useNavigate()
  const showIcon = useShowHeadingIcon()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [noResults, setNoResults] = useState(false)
  const [selected, setSelected] = useState([])
  const [continuing, setContinuing] = useState(false)
  const [showConnecting, setShowConnecting] = useState(false)
  const [tipSlide, setTipSlide] = useState(0)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-rotate tips every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTipSlide((prev) => (prev + 1) % TIPS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [tipSlide])

  const goToTip = useCallback((index) => {
    setTipSlide(index)
  }, [])

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim().replace(/^[@#]/, '')
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
      const filtered = MOCK_SEARCH_RESULTS.filter(
        (r) =>
          r.value.toLowerCase().includes(trimmed.toLowerCase()) ||
          r.description.toLowerCase().includes(trimmed.toLowerCase())
      )
      setResults(filtered)
      setShowResults(true)
      setSearching(false)
      setNoResults(filtered.length === 0)
    }, 500)

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

  function isSelected(value) {
    return selected.some((t) => t.value === value)
  }

  function handleAdd(target) {
    if (isSelected(target.value) || selected.length >= MAX_TARGETS) return
    setSelected((prev) => [...prev, target])
    setQuery('')
    setShowResults(false)
  }

  function handleRemove(value) {
    setSelected((prev) => prev.filter((t) => t.value !== value))
  }

  function handleContinue() {
    if (selected.length === 0) return
    setContinuing(true)
    setTimeout(() => {
      setShowConnecting(true)
    }, 300)
    setTimeout(() => {
      navigate('/signup/growth-plus')
    }, 1800)
  }

  const atLimit = selected.length >= MAX_TARGETS

  // Preparing overlay
  if (showConnecting) {
    return (
      <LoadingOverlay
        icon={Target}
        title={`Setting up ${selected.length === 1 ? 'your target' : `${selected.length} targets`}`}
        subtitle={`Kicksta will start engaging with ${selected.length === 1 ? `${selected[0].value}'s` : "your targets'"} audience...`}
        color="green"
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-md" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-4 text-center lg:mb-6">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
            <Target className="h-6 w-6 text-green-text" />
          </div>
        )}
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Add your targets
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
          Choose accounts or hashtags whose audience matches your ideal followers. We'll engage with their followers so they discover your profile. You need at least one to get started.
        </p>
      </div>

      {/* Search input — always visible */}
      <div ref={containerRef} className="relative mb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-text-muted" />
          )}
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            value={query}
            disabled={atLimit}
            onFocus={() => results.length > 0 && setShowResults(true)}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={atLimit ? 'Limit reached (10)' : 'Search accounts or hashtags'}
            className={cn(
              'h-12 w-full rounded-lg border bg-surface pl-12 pr-12 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
              atLimit ? 'border-border bg-bg' : 'border-border'
            )}
          />
        </div>

        {/* No results */}
        {showResults && noResults && !searching && (
          <div className="absolute inset-x-0 top-14 z-10 flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 shadow-xl">
            <Search className="h-6 w-6 text-text-muted" />
            <p className="text-sm font-medium text-text-primary">No results found</p>
            <p className="text-xs text-text-secondary">Try a different username or hashtag.</p>
          </div>
        )}

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <ul className="absolute inset-x-0 top-14 z-10 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            {results.map((result) => {
              const alreadyAdded = isSelected(result.value)
              return (
                <li key={result.value}>
                  <button
                    type="button"
                    onClick={() => handleAdd(result)}
                    disabled={alreadyAdded}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                      alreadyAdded ? 'opacity-40' : 'hover:bg-bg'
                    )}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-tint">
                      {result.type === 'account' ? (
                        <AtSign className="h-4 w-4 text-blue-text" />
                      ) : (
                        <Hash className="h-4 w-4 text-blue-text" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{result.value}</p>
                      <p className="truncate text-xs text-text-secondary">
                        {result.type === 'account' ? result.followers : result.posts}
                        {' · '}
                        {result.description}
                      </p>
                    </div>
                    {alreadyAdded && (
                      <span className="text-xs text-text-muted">Added</span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Selected targets */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-text-primary">
            {selected.length > 0 ? 'Selected targets' : 'Your targets'}
          </p>
          <p className="text-xs text-text-muted">{selected.length}/{MAX_TARGETS}</p>
        </div>
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((target) => (
              <div
                key={target.value}
                className="inline-flex items-center gap-1.5 rounded-full border border-green-base bg-green-tint py-1 pl-2.5 pr-1.5"
                style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
              >
                {target.type === 'account' ? (
                  <AtSign className="h-3 w-3 text-green-text" />
                ) : (
                  <Hash className="h-3 w-3 text-green-text" />
                )}
                <span className="text-xs font-medium text-green-text">
                  {target.value.replace(/^[@#]/, '')}
                </span>
                <button
                  onClick={() => handleRemove(target.value)}
                  className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-green-base/20"
                  aria-label={`Remove ${target.value}`}
                >
                  <X className="h-3 w-3 text-green-text" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-muted">Search or pick from suggestions below to add targets.</p>
        )}
      </div>

      {/* Suggestions */}
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-text" />
          <p className="text-sm font-medium text-text-primary">Suggested for you</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.filter((s) => !isSelected(s.value)).map((suggestion) => (
            <button
              key={suggestion.value}
              onClick={() => handleAdd(suggestion)}
              disabled={atLimit}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-2.5 pr-3 text-left transition-all',
                atLimit
                  ? 'border-border bg-bg opacity-50'
                  : 'border-border bg-surface shadow-sm hover:border-blue-base hover:shadow-md active:scale-[0.98]'
              )}
            >
              {suggestion.type === 'account' ? (
                <AtSign className="h-3 w-3 text-blue-text" />
              ) : (
                <Hash className="h-3 w-3 text-blue-text" />
              )}
              <span className="text-xs font-medium text-text-primary">
                {suggestion.value.replace(/^[@#]/, '')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={selected.length === 0 || continuing}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
      >
        {continuing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up...
          </>
        ) : selected.length === 0 ? (
          'Add at least one target'
        ) : selected.length === 1 ? (
          'Add 1 target and continue'
        ) : (
          `Add ${selected.length} targets and continue`
        )}
      </button>

      {/* Timeline note */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <Clock className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <p className="text-xs text-text-muted">Growth typically begins within 24–72 hours</p>
      </div>

      {/* Tips carousel */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <div className="grid overflow-hidden">
          {TIPS.map((tip, i) => {
            const TipIcon = tip.icon
            return (
              <div
                key={i}
                className={cn(
                  'col-start-1 row-start-1 flex items-start gap-3 transition-all duration-300',
                  i === tipSlide
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-4 pointer-events-none'
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-tint">
                  <TipIcon className="h-4 w-4 text-blue-text" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{tip.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                    {tip.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dot indicators */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {TIPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToTip(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === tipSlide
                  ? 'w-6 bg-blue-base'
                  : 'w-2 bg-border hover:bg-border-strong'
              )}
              aria-label={`Go to tip ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
