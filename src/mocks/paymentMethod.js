// Single shared payment method on the user account. Per the spec,
// the user always has a card on file (signup requires it) — there
// is no empty state.
export const mockPaymentMethod = {
  brand: 'visa',
  last4: '4242',
  expMonth: 9,
  expYear: 2027,
  billingEmail: 'alex@example.com',
}
