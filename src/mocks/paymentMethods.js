// User-account-level cards on file. Exactly one card has
// `primary: true` at any time — the primary card bills every
// subscription on the account. Per-subscription card overrides
// are deferred to a separate spec.
export const mockPaymentMethods = [
  {
    id: 'pm_001',
    brand: 'visa',
    last4: '4242',
    expMonth: 9,
    expYear: 2027,
    primary: true,
    billingEmail: 'alex@example.com',
  },
  {
    id: 'pm_002',
    brand: 'amex',
    last4: '8888',
    expMonth: 3,
    expYear: 2028,
    primary: false,
    billingEmail: 'alex@example.com',
  },
]
