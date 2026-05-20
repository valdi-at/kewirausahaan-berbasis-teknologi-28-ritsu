import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign In - RITSU',
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-base-100 to-secondary/20 p-4">
      {/* decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* logo */}
        <div className="mb-8 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-md shadow-primary/30">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12M6.34 17.66l2.12-2.12M15.54 8.46l2.12-2.12" />
              </svg>
            </span>
            <span className="text-2xl font-bold tracking-tight">RITSU</span>
          </Link>
          <p className="text-sm text-base-content/40">Your campus, your route</p>
        </div>

        {/* card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="card-title text-xl mb-2">Welcome back</h1>
            <LoginForm />
          </div>
        </div>

        {/* accent tag */}
        <div className="mt-6 flex justify-center">
          <span className="badge badge-secondary badge-lg">ITS Campus Transport</span>
        </div>
      </div>
    </main>
  )
}
