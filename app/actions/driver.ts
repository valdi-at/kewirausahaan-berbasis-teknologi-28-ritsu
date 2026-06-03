'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import path from 'path'
import fs from 'fs/promises'
import { db } from '@/app/lib/db'
import { verifySession } from '@/app/lib/dal'

export type DriverFormState = { error?: string } | undefined

export async function applyForDriver(
  _state: DriverFormState,
  formData: FormData
): Promise<DriverFormState> {
  const session = await verifySession()

  const phoneNumber = (formData.get('phone_number') as string | null)?.trim() ?? ''
  const file = formData.get('driving_license') as File | null

  if (!phoneNumber || phoneNumber.length < 8) {
    return { error: 'A valid phone number (at least 8 digits) is required.' }
  }

  if (!file || file.size === 0) {
    return { error: 'A driving license image is required.' }
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG, or WebP images are allowed.' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File size must be under 5 MB.' }
  }

  const existing = await db.query(
    "SELECT id FROM driver_applications WHERE user_id = $1 AND status = 'pending'",
    [session.userId]
  )
  if ((existing.rowCount ?? 0) > 0) {
    return { error: 'You already have a pending application.' }
  }

  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const filename = `${session.userId}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'licenses')
  await fs.mkdir(uploadDir, { recursive: true })
  const bytes = await file.arrayBuffer()
  await fs.writeFile(path.join(uploadDir, filename), Buffer.from(bytes))
  const imagePath = `/uploads/licenses/${filename}`

  await db.query(
    'INSERT INTO driver_applications (user_id, phone_number, driving_license_image) VALUES ($1, $2, $3)',
    [session.userId, phoneNumber, imagePath]
  )

  revalidatePath('/driver/application')
  redirect('/driver/application')
}
