import { Shield } from 'lucide-react'

// Ambient trust signal at the top of the Growth page. Not a card —
// no border, just a blue-tint surface that sets the tone for the
// configuration choices below.
export default function SafetyStrip() {
  return (
    <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-blue-tint px-4 py-3">
      <Shield className="h-4 w-4 shrink-0 text-blue-text" aria-hidden="true" />
      <p className="text-sm text-blue-text">
        Kicksta stays within Instagram's safe daily limits.
      </p>
    </div>
  )
}
