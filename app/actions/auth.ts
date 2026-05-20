'use server'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { SignupFormSchema, LoginFormSchema, type FormState } from '@/app/lib/definitions'
import { createSession, deleteSession } from '@/app/lib/session'
import { db } from '@/app/lib/db'

export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    username: formData.get('username'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { username, email, password } = validatedFields.data

  let userId: string
  let role: string
  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    )
    if ((existing.rowCount ?? 0) > 0) {
      return { message: 'Email or username is already taken.' }
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const result = await db.query<{ id: string; role: string }>(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, role',
      [username, email, hashedPassword]
    )
    const user = result.rows[0]
    userId = user.id
    role = user.role
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  await createSession(userId, role)
  redirect('/home')
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors }
  }

  const { email, password } = validatedFields.data

  let userId: string
  let role: string
  try {
    const result = await db.query<{ id: string; password_hash: string; role: string }>(
      'SELECT id, password_hash, role FROM users WHERE email = $1',
      [email]
    )
    const user = result.rows[0]

    if (!user) {
      return { message: 'Invalid email or password.' }
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return { message: 'Invalid email or password.' }
    }

    userId = user.id
    role = user.role
  } catch {
    return { message: 'Something went wrong. Please try again.' }
  }

  await createSession(userId, role)
  redirect('/home')
}

export async function logout() {
  await deleteSession()
  redirect('/auth/login')
}
