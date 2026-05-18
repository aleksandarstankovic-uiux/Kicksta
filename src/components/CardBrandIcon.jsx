import { CreditCard } from 'lucide-react'

function VisaIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.46-.658C1.448 8.864.648 8.626 0 8.48l.046-.218h3.3a.89.89 0 01.882.753l.817 4.338 2.018-5.091h2.05zm8.1 5.04c.008-1.98-2.736-2.088-2.717-2.972.006-.269.262-.555.823-.628a3.66 3.66 0 011.912.335l.34-1.59a5.207 5.207 0 00-1.814-.332c-1.917 0-3.266 1.02-3.278 2.48-.013 1.08.963 1.683 1.7 2.042.756.368 1.01.604 1.006.933-.005.504-.602.726-1.16.735-.974.015-1.54-.263-1.992-.474l-.351 1.642c.453.208 1.29.39 2.156.398 2.037 0 3.37-1.006 3.375-2.569zM21.96 15.758H24l-1.782-7.496h-1.654a.884.884 0 00-.828.552l-2.916 6.944h2.036l.405-1.12h2.49l.21 1.12zm-2.166-2.656l1.022-2.82.588 2.82h-1.61zM13.532 8.262l-1.604 7.496H9.98l1.604-7.496h1.948z" fill="currentColor" />
    </svg>
  )
}

function MastercardIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="12" r="7" fill="#EB001B" />
      <circle cx="15" cy="12" r="7" fill="#F79E1B" />
      <path d="M12 6.5a6.98 6.98 0 012.5 5.5 6.98 6.98 0 01-2.5 5.5A6.98 6.98 0 019.5 12 6.98 6.98 0 0112 6.5z" fill="#FF5F00" />
    </svg>
  )
}

function AmexIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="22" height="16" rx="2" fill="#006FCF" />
      <path d="M4.5 14.5L6.5 9h1.6l2 5.5H8.7l-.35-1H6.55l-.35 1H4.5zm2.4-2.1h1.1l-.55-1.65-.55 1.65zM11 14.5V9h2.3l1.15 3.1L15.6 9h2.3v5.5h-1.4v-3.8l-1.3 3.8h-1.3l-1.3-3.8v3.8H11z" fill="white" />
    </svg>
  )
}

const BRAND_ICONS = {
  visa: VisaIcon,
  mastercard: MastercardIcon,
  amex: AmexIcon,
}

export default function CardBrandIcon({ brand, className = 'h-5 w-5' }) {
  const Icon = BRAND_ICONS[brand]
  if (!Icon) return <CreditCard className={className} />
  return <Icon className={className} />
}
