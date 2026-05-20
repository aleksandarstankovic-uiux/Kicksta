// Invoice history across all subscriptions. Newest first. Mix of
// statuses so the table renders all three pill colors. The
// `description` field is what the consolidated billing-history view
// displays; the per-subscription detail filters by `subscriptionId`.
export const mockInvoices = [
  {
    id: 'inv_001',
    subscriptionId: 'sub_001',
    date: '2026-04-01T00:00:00Z',
    amount: 59,
    description: 'Advanced plan + Growth+ — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_002',
    subscriptionId: 'sub_001',
    date: '2026-03-01T00:00:00Z',
    amount: 59,
    description: 'Advanced plan + Growth+ — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_003',
    subscriptionId: 'sub_001',
    date: '2026-02-01T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_004',
    subscriptionId: 'sub_003',
    date: '2026-05-01T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @fitclub.brand',
    status: 'failed',
    pdfUrl: null,
  },
  {
    id: 'inv_005',
    subscriptionId: 'sub_003',
    date: '2026-04-15T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @fitclub.brand',
    status: 'failed',
    pdfUrl: null,
  },
  {
    id: 'inv_006',
    subscriptionId: 'sub_003',
    date: '2026-03-15T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @fitclub.brand',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_007',
    subscriptionId: 'sub_002',
    date: '2026-05-20T00:00:00Z',
    amount: 29,
    description: 'Growth plan — @alex.personal',
    status: 'pending',
    pdfUrl: null,
  },
  {
    id: 'inv_008',
    subscriptionId: 'sub_001',
    date: '2026-01-15T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
]

export function invoicesForSubscription(subscriptionId) {
  return mockInvoices.filter((i) => i.subscriptionId === subscriptionId)
}
