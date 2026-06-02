import * as z from 'zod'

export const SignupFormSchema = z.object({
  username: z
    .string()
    .min(2, { error: 'Username must be at least 2 characters.' })
    .max(50, { error: 'Username must be at most 50 characters.' })
    .regex(/^[a-zA-Z0-9_]+$/, { error: 'Username can only contain letters, numbers, and underscores.' })
    .trim(),
  email: z.email({ error: 'Please enter a valid email address.' }).trim(),
  password: z.string().min(1, { error: 'Password is required.' }).trim(),
})

export const LoginFormSchema = z.object({
  email: z.email({ error: 'Please enter a valid email address.' }).trim(),
  password: z.string().min(1, { error: 'Password is required.' }).trim(),
})

export type SessionPayload = {
  userId: string
  role: string
  expiresAt: Date
}

export type FormState =
  | {
      errors?: {
        username?: string[]
        email?: string[]
        password?: string[]
      }
      message?: string
    }
  | undefined
