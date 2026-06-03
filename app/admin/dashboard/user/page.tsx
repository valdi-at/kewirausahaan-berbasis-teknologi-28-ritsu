import type { Metadata } from 'next'
import { db } from '@/app/lib/db'
import UserTable from './UserTable'

export const metadata: Metadata = { title: 'Users - RITSU Admin' }

type User = {
  id: string
  username: string
  email: string
  role: string
  created_at: string
}

export default async function AdminUsersPage() {
  const result = await db.query<User>(
    'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-base-content/50 text-sm mt-1">
          {result.rowCount ?? 0} user{(result.rowCount ?? 0) !== 1 ? 's' : ''} total
        </p>
      </div>
      <UserTable users={result.rows} />
    </div>
  )
}
