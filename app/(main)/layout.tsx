import Navbar from '@/app/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {/* desktop: push content below top bar | mobile: push content above bottom bar */}
      <div className="min-h-screen pb-24 md:pb-0 md:pt-20">
        {children}
      </div>
    </>
  )
}
