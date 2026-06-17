import { redirect } from 'next/navigation'
import { getUser } from '@/app/lib/dal'
import AdminSidebar from '@/app/components/AdminSidebar'
import PageTransition from '@/app/components/PageTransition'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  if (!user || user.role !== 'admin') redirect('/home')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-base-200 overflow-auto">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
