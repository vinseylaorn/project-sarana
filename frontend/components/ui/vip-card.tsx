// បង្កើត file នៅ: components/icons/vip-card-icon.tsx

export function VipCardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <circle cx="7" cy="15" r="1.2" fill="currentColor" stroke="none" />
      <path d="M11 14.5h6" />
      <path d="M11 16.5h4" />
    </svg>
  )
}