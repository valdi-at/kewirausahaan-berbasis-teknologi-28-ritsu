export type RoutePoint = { lat: number; lng: number }

export type RouteResult = {
  coordinates: [number, number][] // [lat, lng] pairs, ready for Leaflet
  distanceKm: number
}

// Public OSRM demo server — fine for dev/low volume, swap for a self-hosted
// instance (or another routing provider) before relying on this in production.
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'

export function haversineKm(a: RoutePoint, b: RoutePoint): number {
  const R    = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const h    = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export async function getRoute(from: RoutePoint, to: RoutePoint): Promise<RouteResult | null> {
  try {
    const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    if (!res.ok) return null

    const data  = await res.json()
    const route = data.routes?.[0]
    if (!route?.geometry?.coordinates) return null

    return {
      coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      distanceKm:  route.distance / 1000,
    }
  } catch {
    return null
  }
}
