import { create } from 'zustand'
import { useToasts } from '@/stores/useToasts'

// V1 mock for the Instagram Audit feature. Tracks the last download
// timestamp so the card can compute cooldown state. Backend will own
// this state in production — the store goes away.
//
// `download()` stamps the current time and fires a toast. Assumes
// the consumer has already played its 1500ms "Generating audit…" UI
// before calling. Real PDF generation is backend work.
//
// `_reset()` is a QA helper that flips the store back to the
// "never downloaded" state so the cooldown UI can be exercised
// without waiting 24h. Not exposed via UI.
export const useInstagramAudit = create((set) => ({
  lastDownloadedAt: null,
  download: () => {
    set({ lastDownloadedAt: new Date().toISOString() })
    useToasts.getState().addToast({
      message: 'Audit downloaded.',
      tone: 'success',
    })
  },
  _reset: () => set({ lastDownloadedAt: null }),
}))
