// Stub page for the "Manage subscription" link on the Growth+ banner.
// Real management UI (pause/resume billing, plan switch, cancel) is a
// future spec — this exists so the link doesn't dead-end.
export default function AccountGrowthPlusPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth+ subscription
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your Growth+ subscription.
        </p>
      </header>

      <section className="mt-6 rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary lg:p-8">
        Subscription management is coming soon. Reach out to support if you need to make changes today.
      </section>
    </div>
  )
}
