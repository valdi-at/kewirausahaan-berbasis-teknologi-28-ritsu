'use client'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Changing the key unmounts + remounts the div on every navigation,
  // which restarts the CSS animation on .page-enter.
  return (
    <div key={pathname} className="page-enter flex flex-col flex-1">
      {children}
    </div>
  )
}
