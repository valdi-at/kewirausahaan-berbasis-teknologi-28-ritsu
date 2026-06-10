'use client'
import { useFormStatus } from 'react-dom'

function SubmitBtn({ label, cls }: { label: string; cls: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className={`btn btn-block ${cls}`} disabled={pending}>
      {pending ? <span className="loading loading-spinner loading-sm" /> : label}
    </button>
  )
}

export default function StageButton({
  bookingId,
  action,
  label,
  cls = 'btn-primary',
}: {
  bookingId: string
  action: (fd: FormData) => Promise<void>
  label: string
  cls?: string
}) {
  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitBtn label={label} cls={cls} />
    </form>
  )
}
