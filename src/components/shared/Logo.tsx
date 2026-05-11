export function Logo({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="2" className="text-[#5e9bff]" />
      <path stroke="currentColor" strokeWidth="2" d="M32 10v44M10 32h44" className="text-[#5e9bff]" />
      <circle cx="32" cy="32" r="6" fill="currentColor" className="text-[#5e9bff]" />
    </svg>
  )
}
