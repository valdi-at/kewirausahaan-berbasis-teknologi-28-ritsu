'use client'
import { useState, useTransition } from 'react'
import Image from 'next/image'
import { acceptApplication, rejectApplication } from '@/app/actions/admin'

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

const statusBadge: Record<string, string> = {
  pending: 'badge-warning',
  approved: 'badge-success',
  declined: 'badge-error',
}

export default function ApplicationList({ applications }: { applications: Application[] }) {
  const [acceptTarget, setAcceptTarget] = useState<Application | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [isPending, startTransition] = useTransition()

  function openAccept(app: Application) {
    setAcceptTarget(app)
  }

  function openReject(app: Application) {
    setRejectTarget(app)
    setRejectReason('')
    setRejectError('')
  }

  function handleAccept() {
    if (!acceptTarget) return
    startTransition(async () => {
      await acceptApplication(acceptTarget.id)
      setAcceptTarget(null)
    })
  }

  function handleReject() {
    if (!rejectTarget) return
    if (!rejectReason.trim()) {
      setRejectError('Please provide a reason for rejection.')
      return
    }
    startTransition(async () => {
      await rejectApplication(rejectTarget.id, rejectReason)
      setRejectTarget(null)
    })
  }

  return (
    <>
      {applications.length === 0 && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body items-center text-center py-16 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-base-content/20" suppressHydrationWarning>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-base-content/40">No applications yet.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {applications.map(app => (
          <div key={app.id} className="card bg-base-100 shadow-sm">
            <div className="card-body gap-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{app.username}</span>
                    <span className={`badge badge-sm ${statusBadge[app.status] ?? 'badge-ghost'} capitalize`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-sm text-base-content/50">{app.email}</p>
                  <p className="text-sm text-base-content/50">Phone: {app.phone_number}</p>
                  <p className="text-xs text-base-content/30 mt-1">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>

                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => openAccept(app)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-sm btn-error btn-outline"
                      onClick={() => openReject(app)}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {app.status === 'declined' && app.admin_message && (
                  <div className="text-sm text-error/80 italic max-w-xs text-right">
                    &ldquo;{app.admin_message}&rdquo;
                  </div>
                )}
              </div>

              {/* License image */}
              <div>
                <p className="text-xs text-base-content/40 mb-2">Driving License</p>
                <a
                  href={app.driving_license_image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-fit"
                >
                  <div className="relative h-32 w-56 rounded-xl overflow-hidden bg-base-200 border border-base-300">
                    <Image
                      src={app.driving_license_image}
                      alt="Driving license"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Accept confirmation dialog */}
      <dialog className={`modal ${acceptTarget ? 'modal-open' : ''}`}>
        <div className="modal-box rounded-2xl">
          <h3 className="font-bold text-lg">Accept Application</h3>
          <p className="py-4 text-base-content/70">
            Accept{' '}
            <span className="font-semibold text-base-content">{acceptTarget?.username}</span>&apos;s
            driver application? They will be granted driver access immediately.
          </p>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setAcceptTarget(null)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleAccept}
              disabled={isPending}
            >
              {isPending && <span className="loading loading-spinner loading-xs" />}
              Accept
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => !isPending && setAcceptTarget(null)} />
      </dialog>

      {/* Reject dialog */}
      <dialog className={`modal ${rejectTarget ? 'modal-open' : ''}`}>
        <div className="modal-box rounded-2xl">
          <h3 className="font-bold text-lg">Reject Application</h3>
          <p className="pt-4 pb-2 text-base-content/70">
            Rejecting{' '}
            <span className="font-semibold text-base-content">{rejectTarget?.username}</span>&apos;s
            application. Provide a reason that will be shown to the applicant.
          </p>
          <fieldset className="fieldset mt-2">
            <legend className="fieldset-legend">Reason for rejection</legend>
            <textarea
              className={`textarea textarea-bordered w-full h-24 ${rejectError ? 'textarea-error' : ''}`}
              placeholder="e.g. License image is unclear. Please resubmit with a clearer photo."
              value={rejectReason}
              onChange={e => {
                setRejectReason(e.target.value)
                setRejectError('')
              }}
            />
            {rejectError && <p className="fieldset-label text-error">{rejectError}</p>}
          </fieldset>
          <div className="modal-action">
            <button
              className="btn btn-ghost"
              onClick={() => setRejectTarget(null)}
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              className="btn btn-error"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending && <span className="loading loading-spinner loading-xs" />}
              Reject
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => !isPending && setRejectTarget(null)} />
      </dialog>
    </>
  )
}
