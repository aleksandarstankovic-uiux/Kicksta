export const mockPlans = {
  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'Grow your audience with targeted engagement',
    pricing: {
      monthly: { amount: 49.99, period: 'month', perMonth: 49.99 },
      quarterly: { amount: 119.99, period: 'quarter', perMonth: 40.00, savings: 20 },
      yearly: { amount: 359.99, period: 'year', perMonth: 30.00, savings: 40 },
    },
    features: [
      { text: 'Targeted growth engine', included: true },
      { text: 'Up to 10 targets', included: true },
      { text: 'Growth analytics', included: true },
      { text: 'Like after follow', included: true },
      { text: 'Welcome DM', included: false },
      { text: 'Gender targeting', included: false },
      { text: 'Close Friends adder', included: false },
    ],
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    description: 'Full toolkit for serious growth',
    popular: true,
    pricing: {
      monthly: { amount: 99.99, period: 'month', perMonth: 99.99 },
      quarterly: { amount: 239.99, period: 'quarter', perMonth: 80.00, savings: 20 },
      yearly: { amount: 719.99, period: 'year', perMonth: 60.00, savings: 40 },
    },
    features: [
      { text: 'Targeted growth engine', included: true },
      { text: 'Up to 30 targets', included: true },
      { text: 'Growth analytics', included: true },
      { text: 'Like after follow', included: true },
      { text: 'Welcome DM', included: true },
      { text: 'Gender targeting', included: true },
      { text: 'Close Friends adder', included: true },
    ],
  },
}

export const billingPeriods = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
]
