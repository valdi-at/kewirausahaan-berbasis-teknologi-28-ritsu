'use client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { createBooking } from '@/app/actions/booking'
import { getRoute, haversineKm, type RouteResult } from '@/app/lib/routing'
import { ITS_CENTER, ITS_GEOFENCE, isInsideGeofence } from '@/app/lib/geofence'

const FLAT_PRICE      = 10000
const PRICE_PER_KM    = 5000

type PaymentMethod = { id: string; name: string }
type Location      = { lat: number; lng: number; name: string }
type Step          = 'pickup' | 'destination' | 'review'

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { 'Accept-Language': 'id,en' } }
    )
    if (!res.ok) throw new Error()
    const data = await res.json()
    const a    = data.address ?? {}
    const name = [a.road ?? a.amenity ?? a.building, a.suburb ?? a.neighbourhood]
      .filter(Boolean).join(', ')
    return name || data.display_name?.split(',')[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

function pinIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="background:${color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.35)">${label}</div>`,
    className: '',
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
  })
}

export default function BookingMap({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  const containerRef    = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<L.Map | null>(null)
  const pickupMarkerRef = useRef<L.Marker | null>(null)
  const destMarkerRef   = useRef<L.Marker | null>(null)
  const polylineRef     = useRef<L.Polyline | null>(null)
  const routeLineRef    = useRef<L.Polyline | null>(null)
  const pickupRef       = useRef<Location | null>(null)   // avoids stale closure in click handler

  const [step,            setStep]            = useState<Step>('pickup')
  const [pickup,          setPickup]          = useState<Location | null>(null)
  const [destination,     setDestination]     = useState<Location | null>(null)
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id ?? '')
  const [geocoding,       setGeocoding]       = useState(false)
  const [error,           setError]           = useState<string | null>(null)
  const [submitting,      setSubmitting]      = useState(false)
  const [route,           setRoute]           = useState<RouteResult | null>(null)
  const [routing,         setRouting]         = useState(false)

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: ITS_CENTER,
      zoom:   16,
      zoomControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    L.control.zoom({ position: 'topright' }).addTo(map)

    L.polygon(ITS_GEOFENCE, {
      color: '#16a34a', weight: 2, dashArray: '6 6', fillOpacity: 0.05,
    }).addTo(map)

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // ── Drag handler factory: re-geocode and update state on marker drag ────
  const onMarkerDragEnd = (
    setLocation: (loc: Location) => void,
    ref?: React.MutableRefObject<Location | null>
  ) => async (e: L.DragEndEvent) => {
    const { lat, lng } = (e.target as L.Marker).getLatLng()
    setGeocoding(true)
    const name = await reverseGeocode(lat, lng)
    setGeocoding(false)
    const loc: Location = { lat, lng, name }
    if (ref) ref.current = loc
    setLocation(loc)
  }

  // ── Click handler (re-registers when step changes) ───────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || step === 'review') return

    const onMapClick = async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      setGeocoding(true)
      const name = await reverseGeocode(lat, lng)
      setGeocoding(false)
      const loc: Location = { lat, lng, name }

      if (step === 'pickup') {
        pickupMarkerRef.current?.remove()
        pickupMarkerRef.current = L.marker([lat, lng], { icon: pinIcon('P', '#0891b2'), draggable: true })
          .addTo(map)
          .on('dragend', onMarkerDragEnd(setPickup, pickupRef))
        pickupRef.current = loc
        setPickup(loc)
        setStep('destination')
      } else {
        destMarkerRef.current?.remove()
        destMarkerRef.current = L.marker([lat, lng], { icon: pinIcon('D', '#ca8a04'), draggable: true })
          .addTo(map)
          .on('dragend', onMarkerDragEnd(setDestination))

        setDestination(loc)
        setStep('review')
      }
    }

    map.on('click', onMapClick)
    return () => { map.off('click', onMapClick) }
  }, [step])

  // ── Fetch the road route once both points are set ────────────────────────
  useEffect(() => {
    const map = mapRef.current
    if (!map || !pickup || !destination) {
      setRoute(null)
      return
    }

    // Immediate straight-line preview while the road route loads
    polylineRef.current?.remove()
    routeLineRef.current?.remove(); routeLineRef.current = null
    polylineRef.current = L.polyline([[pickup.lat, pickup.lng], [destination.lat, destination.lng]], {
      color: '#0891b2', weight: 3, dashArray: '8 6',
    }).addTo(map)
    map.fitBounds(polylineRef.current.getBounds(), { padding: [60, 60] })

    let cancelled = false
    setRouting(true)

    getRoute(pickup, destination).then(result => {
      if (cancelled) return
      setRouting(false)
      setRoute(result)
      if (!result) return

      polylineRef.current?.remove();  polylineRef.current  = null
      routeLineRef.current = L.polyline(result.coordinates, {
        color: '#0891b2', weight: 4,
      }).addTo(map)
      map.fitBounds(routeLineRef.current.getBounds(), { padding: [60, 60] })
    })

    return () => { cancelled = true }
  }, [pickup, destination])

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    pickupMarkerRef.current?.remove();  pickupMarkerRef.current  = null
    destMarkerRef.current?.remove();    destMarkerRef.current    = null
    polylineRef.current?.remove();      polylineRef.current      = null
    routeLineRef.current?.remove();     routeLineRef.current     = null
    pickupRef.current = null
    setPickup(null); setDestination(null); setStep('pickup'); setError(null); setRoute(null)
    mapRef.current?.setView(ITS_CENTER, 16)
  }

  // ── Pricing ───────────────────────────────────────────────────────────────
  const pickupInside = pickup      ? isInsideGeofence(pickup)      : false
  const destInside   = destination ? isInsideGeofence(destination) : false
  const bothOutside  = !!pickup && !!destination && !pickupInside && !destInside

  const distance = pickup && destination ? (route?.distanceKm ?? haversineKm(pickup, destination)) : 0
  const price    = (pickupInside && destInside) ? FLAT_PRICE : Math.round(distance * PRICE_PER_KM)

  // ── Book ──────────────────────────────────────────────────────────────────
  const handleBook = async () => {
    if (!pickup || !destination || bothOutside) return
    setSubmitting(true)
    setError(null)
    const result = await createBooking({
      pickupLocation: JSON.stringify(pickup),
      destination:    JSON.stringify(destination),
      price,
      distance,
      paymentMethodId,
    })
    if (result?.error) { setError(result.error); setSubmitting(false) }
    // on success, createBooking redirects — setSubmitting never gets called
  }

  return (
    <div className="relative h-[calc(100dvh-6rem)] md:h-[calc(100dvh-5rem)] overflow-hidden">

      {/* Map */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Geocoding indicator */}
      {geocoding && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] badge badge-neutral gap-2 py-3 px-4 shadow-lg">
          <span className="loading loading-spinner loading-xs" />
          Getting location…
        </div>
      )}

      {/* Bottom sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-base-100 rounded-t-3xl shadow-2xl">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-base-300" />
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-3 py-2 px-6">
          {(['pickup', 'destination', 'review'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${step === 'pickup' && i > 0 ? 'bg-base-300' : step === 'destination' && i > 1 ? 'bg-base-300' : 'bg-primary'}`} />}
              <div className={`h-2.5 w-2.5 rounded-full transition-colors ${s === step ? 'bg-primary scale-125' : ['pickup', 'destination', 'review'].indexOf(s) < ['pickup', 'destination', 'review'].indexOf(step) ? 'bg-primary' : 'bg-base-300'}`} />
            </div>
          ))}
        </div>

        <div className="px-5 pb-6 pt-2">

          {step === 'pickup' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Tap the map to set your pickup point</p>
              <p className="text-xs text-base-content/50">The map is centered on ITS campus.</p>
            </div>
          )}

          {step === 'destination' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-[#0891b2] shrink-0" />
                <span className="truncate text-base-content/70">{pickup?.name}</span>
                <button onClick={reset} className="btn btn-ghost btn-xs ml-auto">Reset</button>
              </div>
              <p className="text-sm font-semibold">Now tap your destination</p>
            </div>
          )}

          {step === 'review' && pickup && destination && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0891b2] shrink-0" />
                  <span className="truncate">{pickup.name}</span>
                </div>
                <span className="ml-[3px] w-px h-3 bg-base-300 block" />
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-sm bg-[#ca8a04] shrink-0" />
                  <span className="truncate">{destination.name}</span>
                </div>
              </div>

              <div className="flex gap-3 text-sm">
                <div className="flex-1 bg-base-200 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-base-content/50">Distance</p>
                  <p className="font-semibold">
                    {routing
                      ? <span className="loading loading-spinner loading-xs" />
                      : `${distance.toFixed(1)} km`}
                  </p>
                </div>
                <div className="flex-1 bg-base-200 rounded-xl px-3 py-2 text-center">
                  <p className="text-xs text-base-content/50">Est. Price</p>
                  <p className="font-semibold">Rp {price.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {!routing && !route && (
                <p className="text-xs text-base-content/40 -mt-2">
                  Route unavailable — showing straight-line distance.
                </p>
              )}

              {!bothOutside && !(pickupInside && destInside) && (
                <p className="text-xs text-base-content/40 -mt-2">
                  One point is outside the ITS campus area — priced at Rp {PRICE_PER_KM.toLocaleString('id-ID')}/km.
                </p>
              )}

              {bothOutside && (
                <p className="text-xs text-error -mt-2">
                  At least one of the pickup or destination points must be inside the ITS campus area.
                </p>
              )}

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium shrink-0">Payment</label>
                <select
                  className="select select-bordered select-sm flex-1"
                  value={paymentMethodId}
                  onChange={e => setPaymentMethodId(e.target.value)}
                >
                  {paymentMethods.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-xs text-error">{error}</p>}

              <div className="flex gap-2">
                <button onClick={reset} className="btn btn-ghost btn-sm">
                  Reset
                </button>
                <button
                  onClick={handleBook}
                  disabled={submitting || bothOutside}
                  className="btn btn-primary flex-1"
                >
                  {submitting
                    ? <span className="loading loading-spinner loading-sm" />
                    : 'Confirm Booking'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
