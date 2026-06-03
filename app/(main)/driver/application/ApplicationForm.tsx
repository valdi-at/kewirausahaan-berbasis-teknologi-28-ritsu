'use client'
import { useActionState } from 'react'
import { applyForDriver } from '@/app/actions/driver'

export default function ApplicationForm() {
  const [state, action, pending] = useActionState(applyForDriver, undefined)

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body gap-4">
        <div>
          <h1 className="card-title text-lg">Apply to Become a Driver</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Fill in your details below. Our team will review your application and get back to you.
          </p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          {state?.error && (
            <div role="alert" className="alert alert-error alert-soft">
              <span>{state.error}</span>
            </div>
          )}

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Phone Number</legend>
            <input
              name="phone_number"
              type="tel"
              placeholder="+62 812 3456 7890"
              required
              className="input w-full"
            />
            <p className="fieldset-label">Your active phone number for driver communications.</p>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Driving License Image</legend>
            <input
              name="driving_license"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              required
              className="file-input w-full"
            />
            <p className="fieldset-label">JPEG, PNG, or WebP. Max 5 MB. Make sure the image is clear and legible.</p>
          </fieldset>

          <button type="submit" disabled={pending} className="btn btn-primary w-full mt-1">
            {pending ? <span className="loading loading-spinner loading-sm" /> : null}
            {pending ? 'Submitting…' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}
