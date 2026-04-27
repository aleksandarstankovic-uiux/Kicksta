// Tinted icon chip used as the visual identity for each settings card.
// Color carries meaning per CLAUDE.md tokens: bg-<color>-tint with the
// icon in text-<color>-base. Default size is 36px (h-9 w-9), icon 18px.
//
// Usage: <CardChip color="blue" icon={Settings2} />
//
// Tailwind v4 content scan — the className uses template-literal
// interpolation (`bg-${color}-tint`), which the scanner does not
// resolve. The lines below appear as raw literals so every supported
// color is emitted in the CSS bundle. Add new colors here when used.
//   bg-blue-tint   text-blue-base
//   bg-green-tint  text-green-base
//   bg-yellow-tint text-yellow-base
//   bg-purple-tint text-purple-base
//   bg-red-tint    text-red-base
export default function CardChip({ color = 'blue', icon: Icon, size = 'md' }) {
  const dim = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const iconDim = size === 'lg' ? 'h-5 w-5' : 'h-[18px] w-[18px]'

  // Neutral chip variant — used for the Blacklist half (no -base tint).
  if (color === 'neutral') {
    return (
      <span
        aria-hidden="true"
        className={`flex ${dim} shrink-0 items-center justify-center rounded-lg bg-bg text-text-secondary`}
      >
        <Icon className={iconDim} />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`flex ${dim} shrink-0 items-center justify-center rounded-lg bg-${color}-tint text-${color}-base`}
    >
      <Icon className={iconDim} />
    </span>
  )
}
