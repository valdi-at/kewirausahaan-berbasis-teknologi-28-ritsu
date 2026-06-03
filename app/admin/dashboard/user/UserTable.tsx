'use client'
import { useState, useTransition } from 'react'
import { updateUserRole, deleteUser } from '@/app/actions/admin'

type User = {
  id: string
  username: string
  email: string
  role: string
  created_at: string
}

const roleBadge: Record<string, string> = {
  admin: 'badge-warning',
  driver: 'badge-primary',
  customer: 'badge-ghost',
}

export default function UserTable({ users }: { users: User[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRoleChange(userId: string, newRole: string) {
    setPendingId(userId)
    startTransition(async () => {
      await updateUserRole(userId, newRole)
      setPendingId(null)
    })
  }

  function handleDelete(userId: string) {
    startTransition(async () => {
      await deleteUser(userId)
      setDeleteTargetId(null)
    })
  }

  const deleteTarget = users.find(u => u.id === deleteTargetId)

  return (
    <>
      <div className="card bg-base-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="bg-base-200/60">
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-base-content/40 py-8">No users found.</td>
                </tr>
              )}
              {users.map(user => (
                <tr key={user.id} className="hover:bg-base-50">
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-placeholder">
                        <div className="bg-base-300 text-base-content w-8 rounded-full">
                          <span className="text-xs font-bold">{user.username.slice(0, 2).toUpperCase()}</span>
                        </div>
                      </div>
                      <span className="font-medium text-sm">{user.username}</span>
                    </div>
                  </td>
                  <td className="text-sm text-base-content/60">{user.email}</td>
                  <td>
                    <select
                      className="select select-xs select-bordered"
                      defaultValue={user.role}
                      disabled={pendingId === user.id || isPending}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="customer">customer</option>
                      <option value="driver">driver</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="text-xs text-base-content/40">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => setDeleteTargetId(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <dialog id="delete-user-modal" className={`modal ${deleteTargetId ? 'modal-open' : ''}`}>
        <div className="modal-box rounded-2xl">
          <h3 className="font-bold text-lg">Delete User</h3>
          <p className="py-4 text-base-content/70">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-base-content">{deleteTarget?.username}</span>?
            This action cannot be undone.
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setDeleteTargetId(null)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              className="btn btn-error"
              onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
              disabled={isPending}
            >
              {isPending && <span className="loading loading-spinner loading-xs" />}
              Delete
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => setDeleteTargetId(null)} />
      </dialog>
    </>
  )
}
