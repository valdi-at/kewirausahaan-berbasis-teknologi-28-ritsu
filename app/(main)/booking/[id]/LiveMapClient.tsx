'use client'
import dynamic from 'next/dynamic'

type Point = { lat: number; lng: number; name: string }

const LiveMap = dynamic(() => import('./LiveMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center rounded-xl bg-base-200">
      <span className="loading loading-spinner loading-md text-primary" />
    </div>
  ),
})

export default function LiveMapClient(props: { bookingId: string; pickup: Point; destination: Point }) {
  return <LiveMap {...props} />
}
