export function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className ?? "size-3"} fill="none">
      <path
        d="M6 4.5h5.5V10M11.5 4.5 5 11"
        className="stroke-current"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
