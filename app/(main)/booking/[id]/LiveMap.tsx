'use client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { getRoute } from '@/app/lib/routing'

type Point = { lat: number; lng: number; name: string }

function pinIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.35)">${label}</div>`,
    className: '',
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
  })
}

const driverIcon = L.divIcon({
  html: `<div style="background:#16a34a;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 2px 6px rgba(0,0,0,.35);border:2px solid #fff">🛵</div>`,
  className: '',
  iconSize:   [34, 34],
  iconAnchor: [17, 17],
})

export default function LiveMap({
  bookingId,
  pickup,
  destination,
}: {
  bookingId: string
  pickup: Point
  destination: Point
}) {
  const containerRef     = useRef<HTMLDivElement>(null)
  const mapRef           = useRef<L.Map | null>(null)
  const driverMarkerRef  = useRef<L.Marker | null>(null)
  const lineRef          = useRef<L.Polyline | null>(null)
  const routeLineRef     = useRef<L.Polyline | null>(null)

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [updatedAt,      setUpdatedAt]      = useState<string | null>(null)

  // ── Init map with pickup/destination markers ─────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.control.zoom({ position: 'topright' }).addTo(map)

    L.marker([pickup.lat, pickup.lng], { icon: pinIcon('P', '#0891b2') }).addTo(map)
    L.marker([destination.lat, destination.lng], { icon: pinIcon('D', '#ca8a04') }).addTo(map)
    lineRef.current = L.polyline([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], {
      color: '#0891b2', weight: 3, dashArray: '8 6',
    }).addTo(map)

    map.fitBounds([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], { padding: [50, 50] })

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null; lineRef.current = null; routeLineRef.current = null }
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng])

  // ── Fetch the road route and overlay it in place of the straight line ────
  useEffect(() => {
    let cancelled = false

    getRoute(pickup, destination).then(result => {
      const map = mapRef.current
      if (cancelled || !result || !map) return

      lineRef.current?.remove(); lineRef.current = null
      routeLineRef.current?.remove()
      routeLineRef.current = L.polyline(result.coordinates, {
        color: '#0891b2', weight: 4,
      }).addTo(map)

      const bounds = routeLineRef.current.getBounds()
      if (driverMarkerRef.current) bounds.extend(driverMarkerRef.current.getLatLng())
      map.fitBounds(bounds, { padding: [50, 50] })
    })

    return () => { cancelled = true }
  }, [pickup.lat, pickup.lng, destination.lat, destination.lng])

  // ── Poll driver's current location ───────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/driver-location`, { cache: 'no-store' })
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled || !data.location) return
        setDriverLocation({ lat: data.location.lat, lng: data.location.lng })
        setUpdatedAt(data.location.updatedAt)
      } catch {}
    }

    poll()
    const id = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(id) }
  }, [bookingId])

  // ── Update / place driver marker ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !driverLocation) return

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker([driverLocation.lat, driverLocation.lng], { icon: driverIcon }).addTo(map)
      const bounds = routeLineRef.current
        ? routeLineRef.current.getBounds()
        : L.latLngBounds([[pickup.lat, pickup.lng], [destination.lat, destination.lng]])
      bounds.extend([driverLocation.lat, driverLocation.lng])
      map.fitBounds(bounds, { padding: [50, 50] })
    } else {
      driverMarkerRef.current.setLatLng([driverLocation.lat, driverLocation.lng])
    }
  }, [driverLocation, pickup, destination])

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl">
      <div ref={containerRef} className="absolute inset-0" />

      {!driverLocation && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] badge badge-neutral gap-2 py-3 px-4 shadow-lg">
          <span className="loading loading-spinner loading-xs" />
          Waiting for driver location…
        </div>
      )}

      {driverLocation && updatedAt && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] badge badge-neutral gap-1.5 py-3 px-3 shadow-lg text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Updated {new Date(updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      )}
    </div>
  )
}
