import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount) {
  return amount % 1 === 0 ? `$${amount}` : `$${amount.toFixed(2)}`
}

export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (num >= 10000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return num.toLocaleString()
}
