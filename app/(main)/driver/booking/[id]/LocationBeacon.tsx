'use client'
import { useEffect } from 'react'

export default function LocationBeacon() {
  useEffect(() => {
    if (!('geolocation' in navigator)) return

    const send = (pos: GeolocationPosition) => {
      fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        keepalive: true,
      }).catch(() => {})
    }

    const watchId = navigator.geolocation.watchPosition(send, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 5000,
    })

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  return null
}
