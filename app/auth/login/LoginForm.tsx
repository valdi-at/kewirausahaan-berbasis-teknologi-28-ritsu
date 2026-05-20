'use client'
import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          placeholder="••••••••"
          required
          className={`input w-full ${state?.errors?.password ? 'input-error' : ''}`}
        />
        {state?.errors?.password && (
          <p className="fieldset-label text-error">{state.errors.password[0]}</p>
        )}
      </fieldset>

      {state?.message && (
        <div role="alert" className="alert alert-error alert-soft">
          <span>{state.message}</span>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-full mt-1">
        {pending ? <span className="loading loading-spinner loading-sm" /> : null}
        {pending ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-base-content/50">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="link link-primary font-medium">
          Register here
        </Link>
      </p>
    </form>
  )
}
