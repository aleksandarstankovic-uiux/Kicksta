import { useState } from 'react'
import GrowthPlusSubscribeModal from '@/components/GrowthPlusSubscribeModal'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusSubscribeOverlay from './GrowthPlusSubscribeOverlay'

// Non-subscriber state for the Growth+ page. Renders the live
// subscriber dashboard behind a subtle blur + non-interactive overlay,
// floats the subscribe card on top. Subscribing flips the Zustand
// flag and the page re-renders into the live dashboard inline.
export default function GrowthPlusLockedPreview({ account }) {
  const [modalState, setModalState] = useState(null)
  const markSubscribed = useGrowthPlusSubscription((s) => s.markSubscribed)

  function handleSubscribeSuccess() {
    setModalState(null)
    markSubscribed()
  }

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none opacity-60 blur-[2px]"
      >
        <GrowthPlusActive account={account} previewMode />
      </div>

      <GrowthPlusSubscribeOverlay
        onSubscribeClick={() => setModalState('confirm')}
      />

      <GrowthPlusSubscribeModal
        state={modalState}
        onClose={() => setModalState(null)}
        onConfirm={() => setModalState('processing')}
        onProcessingDone={() => setModalState('success')}
        onSuccess={handleSubscribeSuccess}
      />
    </div>
  )
}
