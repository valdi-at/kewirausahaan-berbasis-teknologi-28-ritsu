'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'

export default function RegisterForm() {
  const [state, action, pending] = useActionState(signup, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset className="fieldset">
        <legend className="fieldset-legend">Username</legend>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="yourname123"
          required
          className={`input w-full ${state?.errors?.username ? 'input-error' : ''}`}
        />
        {state?.errors?.username && (
          <p className="fieldset-label text-error">{state.errors.username[0]}</p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Email</legend>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          className={`input w-full ${state?.errors?.email ? 'input-error' : ''}`}
        />
        {state?.errors?.email && (
          <p className="fieldset-label text-error">{state.errors.email[0]}</p>
        )}
      </fieldset>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Password</legend>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          className={`input w-full ${state?.errors?.password ? 'input-error' : ''}`}
        />
        {state?.errors?.password ? (
          <ul className="fieldset-label text-error space-y-0.5">
            {state.errors.password.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        ) : (
          <p className="fieldset-label">At least 8 characters with a letter and number.</p>
        )}
      </fieldset>

      {state?.message && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.message}</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full mt-1">
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        {pending ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-base-content/50">
        Already have an account?{' '}
        <Link href="/auth/login" className="link link-primary font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
