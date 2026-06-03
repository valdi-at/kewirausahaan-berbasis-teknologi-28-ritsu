import type { Metadata } from 'next'
import { db } from '@/app/lib/db'
import ApplicationList from './ApplicationList'

export const metadata: Metadata = { title: 'Applications - RITSU Admin' }

type Application = {
  id: string
  user_id: string
  username: string
  email: string
  phone_number: string
  driving_license_image: string
  status: string
  admin_message: string | null
  created_at: string
}

export default async function AdminApplicationsPage() {
  const result = await db.query<Application>(`
    SELECT
      da.id, da.user_id, da.phone_number, da.driving_license_image,
      da.status, da.admin_message, da.created_at,
      u.username, u.email
    FROM driver_applications da
    JOIN users u ON da.user_id = u.id
    ORDER BY
      CASE da.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
      da.created_at DESC
  `)

  const pending = result.rows.filter(r => r.status === 'pending').length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Driver Applications</h1>
        <p className="text-base-content/50 text-sm mt-1">
          {result.rowCount ?? 0} application{(result.rowCount ?? 0) !== 1 ? 's' : ''} total
          {pending > 0 && (
            <span className="ml-2 badge badge-warning badge-sm">{pending} pending</span>
          )}
        </p>
      </div>
      <ApplicationList applications={result.rows} />
    </div>
  )
}
