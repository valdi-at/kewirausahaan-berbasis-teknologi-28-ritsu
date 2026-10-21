export const ERROR_STATUS = {
  VALIDATION_ERROR:      400,
  UNAUTHORIZED:          401,
  INVALID_CREDENTIALS:   401,
  FORBIDDEN:             403,
  SELF_ACTION_FORBIDDEN: 403,
  NOT_FOUND:             404,
  ALREADY_REVIEWED:      409,
  HAS_DEPENDENCIES:      409,
  RATE_LIMITED:          429,
  INTERNAL:              500,
} as const

export type ErrorCode = keyof typeof ERROR_STATUS

export class ApiError extends Error {
  status: number
  code: ErrorCode
  details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = ERROR_STATUS[code]
    this.details = details
  }
}
