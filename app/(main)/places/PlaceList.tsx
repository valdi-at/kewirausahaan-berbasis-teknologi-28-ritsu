'use client'
import { useState } from 'react'
import Link from 'next/link'
import { places, categoryLabels, categoryIcons, type PlaceCategory } from '@/app/lib/places'

const categories = Object.keys(categoryLabels) as PlaceCategory[]

function categoryStyle(category: PlaceCategory): { bg: string; badgeClass: string } {
  switch (category) {
    case 'faculty':  return { bg: 'from-primary/20 to-primary/5',    badgeClass: 'badge-primary' }
    case 'mosque':   return { bg: 'from-success/20 to-success/5',    badgeClass: 'badge-success' }
    case 'food':     return { bg: 'from-warning/25 to-warning/5',    badgeClass: 'badge-warning' }
    case 'park':     return { bg: 'from-success/15 to-success/5',    badgeClass: 'badge-success badge-outline' }
    case 'sports':   return { bg: 'from-info/20 to-info/5',          badgeClass: 'badge-info' }
    case 'library':  return { bg: 'from-secondary/30 to-secondary/5', badgeClass: 'badge-secondary' }
    case 'admin':    return { bg: 'from-neutral/15 to-neutral/5',    badgeClass: 'badge-neutral' }
  }
}

export default function PlaceList() {
  const [selected, setSelected] = useState<PlaceCategory | null>(null)

  const filtered = selected ? places.filter((p) => p.category === selected) : places

  return (
    <div>
      {/* ── Category filter ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelected(null)}
          className={`btn btn-sm rounded-full shrink-0 transition-all ${
            selected === null ? 'btn-primary shadow-sm' : 'btn-ghost'
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelected(cat)}
            className={`btn btn-sm rounded-full shrink-0 transition-all ${
              selected === cat ? 'btn-primary shadow-sm' : 'btn-ghost'
            }`}
          >
            <span>{categoryIcons[cat]}</span>
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* ── Count ── */}
      <p className="text-sm text-base-content/40 mt-3 mb-5">
        {filtered.length} lokasi{selected ? ` · ${categoryLabels[selected]}` : ''}
      </p>

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 stagger">
        {filtered.map((place) => {
          const { bg, badgeClass } = categoryStyle(place.category)
          return (
            <Link
              key={place.id}
              href={`/places/${place.id}`}
              className="card bg-base-100 shadow-sm overflow-hidden"
            >
              {/* Placeholder image banner */}
              <div className={`h-28 md:h-32 bg-gradient-to-br ${bg} flex items-center justify-center`}>
                <span className="text-4xl md:text-5xl" aria-hidden="true">
                  {categoryIcons[place.category]}
                </span>
              </div>

              <div className="card-body p-3 md:p-4 gap-1.5">
                <span className={`badge badge-sm w-fit ${badgeClass}`}>
                  {categoryLabels[place.category]}
                </span>
                <h3 className="font-bold text-sm md:text-base leading-tight">{place.name}</h3>
                <p className="text-xs text-base-content/55 leading-relaxed line-clamp-2">
                  {place.shortDesc}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
