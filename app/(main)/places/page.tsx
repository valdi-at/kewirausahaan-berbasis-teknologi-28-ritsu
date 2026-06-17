import type { Metadata } from 'next'
import PlaceList from './PlaceList'

export const metadata: Metadata = { title: 'Jelajahi Kampus - RITSU' }

export default function PlacesPage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-primary via-primary to-accent text-primary-content px-6 py-12 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full border border-primary-content/10" />
        <div className="pointer-events-none absolute bottom-0 -left-12 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
        <div className="mx-auto max-w-2xl relative">
          <div className="badge badge-secondary mb-3 gap-1 px-3 py-2.5 text-sm font-medium">
            🗺️ Kampus ITS Sukolilo
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-2 tracking-tight">
            Jelajahi Kampus ITS
          </h1>
          <p className="text-primary-content/75 text-base">
            Temukan gedung, fasilitas, dan tempat menarik di kampus ITS Surabaya.
          </p>
        </div>
      </div>

      {/* ── List ── */}
      <div className="bg-base-200 flex-1">
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-8">
          <PlaceList />
        </div>
      </div>

    </div>
  )
}
