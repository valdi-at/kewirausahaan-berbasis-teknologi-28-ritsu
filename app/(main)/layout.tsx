import Navbar from '@/app/components/Navbar'
import { getUser } from '@/app/lib/dal'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <>
      <Navbar role={user?.role ?? 'customer'} />
      {/* desktop: push content below top bar | mobile: push content above bottom bar */}
      <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
        {children}
      </div>
    </>
  )
}
