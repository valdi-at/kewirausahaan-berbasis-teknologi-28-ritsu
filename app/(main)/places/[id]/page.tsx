import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPlaceById, categoryLabels, categoryIcons, type PlaceCategory } from '@/app/lib/places'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const place = getPlaceById(id)
  if (!place) return { title: 'Lokasi tidak ditemukan - RITSU' }
  return { title: `${place.name} - RITSU` }
}

function heroBg(category: PlaceCategory): string {
  switch (category) {
    case 'faculty': return 'from-primary/30 via-primary/15 to-primary/5'
    case 'mosque':  return 'from-success/30 via-success/15 to-success/5'
    case 'food':    return 'from-warning/35 via-warning/15 to-warning/5'
    case 'park':    return 'from-success/20 via-success/10 to-success/5'
    case 'sports':  return 'from-info/30 via-info/15 to-info/5'
    case 'library': return 'from-secondary/35 via-secondary/15 to-secondary/5'
    case 'admin':   return 'from-neutral/20 via-neutral/10 to-neutral/5'
  }
}

function badgeClass(category: PlaceCategory): string {
  switch (category) {
    case 'faculty': return 'badge-primary'
    case 'mosque':  return 'badge-success'
    case 'food':    return 'badge-warning'
    case 'park':    return 'badge-success badge-outline'
    case 'sports':  return 'badge-info'
    case 'library': return 'badge-secondary'
    case 'admin':   return 'badge-neutral'
  }
}

export default async function PlaceDetailPage({ params }: Props) {
  const { id } = await params
  const place = getPlaceById(id)
  if (!place) notFound()

  return (
    <div className="flex flex-col">

      {/* ── Hero banner ── */}
      <div className={`bg-gradient-to-br ${heroBg(place.category)} px-6 pt-10 pb-12 relative overflow-hidden`}>
        <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full border border-base-content/5" />
        <div className="mx-auto max-w-2xl">
          <Link
            href="/places"
            className="inline-flex items-center gap-1.5 text-sm text-base-content/50 hover:text-base-content transition-colors mb-5"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Semua lokasi
          </Link>

          <div className="flex items-start gap-4">
            <div className="text-5xl md:text-6xl mt-1 shrink-0" aria-hidden="true">
              {categoryIcons[place.category]}
            </div>
            <div>
              <span className={`badge badge-sm mb-2 ${badgeClass(place.category)}`}>
                {categoryLabels[place.category]}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight">
                {place.name}
              </h1>
              <p className="text-base-content/60 mt-1 text-sm md:text-base">
                {place.shortDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="bg-base-200 flex-1">
        <div className="mx-auto max-w-2xl px-4 md:px-6 py-8 flex flex-col gap-6">

          {/* Description */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body gap-2">
              <h2 className="font-bold text-base">Tentang Lokasi</h2>
              <p className="text-base-content/70 leading-relaxed text-sm md:text-base">
                {place.description}
              </p>
            </div>
          </div>

          {/* Items list */}
          {place.items && place.items.length > 0 && (
            <div>
              <h2 className="font-bold text-base mb-3 px-1">
                {place.category === 'faculty' ? 'Departemen' :
                 place.category === 'food' ? 'Menu & Fasilitas' :
                 'Fasilitas & Tempat'}
              </h2>
              <div className="flex flex-col gap-2 stagger">
                {place.items.map((item) => (
                  <div key={item.label} className="card bg-base-100 shadow-sm">
                    <div className="card-body flex-row items-start gap-3 p-4">
                      <span className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">{item.label}</p>
                        {item.desc && (
                          <p className="text-xs text-base-content/55 mt-0.5">{item.desc}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Book CTA */}
          <div className="card bg-gradient-to-r from-primary/10 to-accent/10 shadow-sm border border-primary/15">
            <div className="card-body flex-row items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-semibold text-sm">Mau ke sini?</p>
                <p className="text-xs text-base-content/55 mt-0.5">
                  Pesan ojek kampus dan tiba langsung di lokasi.
                </p>
              </div>
              <Link href="/booking/create" className="btn btn-primary btn-sm rounded-full shrink-0">
                Pesan Ride
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
