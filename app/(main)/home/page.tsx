import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Home - RITSU' }

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Instant Booking',
    desc: 'Find a driver anywhere on the ITS campus in seconds - no waiting, no guessing.',
    colorClass: 'text-primary bg-primary/10',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Live Tracking',
    desc: 'Watch your driver navigate to you in real time on a live campus map.',
    colorClass: 'text-warning bg-warning/10',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" suppressHydrationWarning>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: 'Flexible Payment',
    desc: 'Pay with cash, e-wallet, or any linked payment method at your convenience.',
    colorClass: 'text-success bg-success/10',
  },
]

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <div className="hero min-h-[65vh] bg-gradient-to-br from-primary via-primary to-accent text-primary-content relative overflow-hidden">
        {/* decorative rings */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full border border-primary-content/10" />
        <div className="pointer-events-none absolute -top-12 -right-12 h-72 w-72 rounded-full border border-primary-content/10" />
        <div className="pointer-events-none absolute bottom-0 -left-20 h-64 w-64 rounded-full bg-secondary/30 blur-3xl" />

        <div className="hero-content flex-col lg:flex-row-reverse max-w-3xl w-full px-6 py-16 lg:py-0">
          <div className="w-full max-w-md">
            <div className="badge badge-secondary mb-4 gap-1 px-3 py-3 text-sm font-medium">
              🚌 ITS Campus Transport
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 tracking-tight">
              Your smart ride around ITS campus
            </h1>
            <p className="text-lg text-primary-content/80 mb-8">
              Book a driver, track your route, and arrive on time - all in one tap.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/booking" className="btn btn-secondary shadow-lg">
                Book a Ride
              </Link>
              <Link href="/places" className="btn btn-ghost border-primary-content/30 text-primary-content">
                Explore Campus
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Features ── */}
      <div className="bg-base-200 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="text-center text-base-content/50 mb-10">
            Built specifically for the ITS campus community.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon, title, desc, colorClass }) => (
              <div key={title} className="card bg-base-100 shadow-sm">
                <div className="card-body gap-3">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${colorClass}`}>
                    {icon}
                  </span>
                  <h3 className="card-title text-base">{title}</h3>
                  <p className="text-sm text-base-content/60 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="bg-base-100 flex justify-center px-4 py-6 border-b border-base-200">
        <div className="stats stats-horizontal shadow-sm w-full max-w-2xl">
          <div className="stat place-items-center">
            <div className="stat-value text-primary text-2xl">50+</div>
            <div className="stat-desc">Active Drivers</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-value text-primary text-2xl">ITS</div>
            <div className="stat-desc">Full Campus</div>
          </div>
          <div className="stat place-items-center">
            <div className="stat-value text-primary text-2xl">&lt;5m</div>
            <div className="stat-desc">Avg. Pickup</div>
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="bg-base-200 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            How it works
          </h2>
          <ul className="steps steps-vertical w-full">
            {[
              { title: 'Set your destination', desc: 'Pick a starting point and where you want to go anywhere on campus.' },
              { title: 'Match with a driver', desc: 'A nearby campus driver sees your request and confirms the pickup.' },
              { title: 'Ride safely', desc: 'Track your driver live and arrive right on time.' },
            ].map(({ title, desc }) => (
              <li key={title} className="step step-primary">
                <div className="text-left pl-2">
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-base-content/50 mt-0.5">{desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── CTA banner ── */}
      <div className="bg-gradient-to-r from-secondary/40 to-primary/20 px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to ride?</h2>
          <p className="text-base-content/60 mb-6">
            Join hundreds of ITS students and staff already using RITSU daily.
          </p>
          <Link href="/booking" className="btn btn-primary btn-wide shadow-md">
            Get Started
          </Link>
        </div>
      </div>

    </div>
  )
}
