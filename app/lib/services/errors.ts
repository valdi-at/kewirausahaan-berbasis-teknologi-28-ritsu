// Domain errors thrown by app/lib/services/*. The web actions turn them into
// { error } and the desktop API turns them into ApiError with the same code.
export type ServiceErrorCode =
  | 'VALIDATION_ERROR'
  | 'SELF_ACTION_FORBIDDEN'
  | 'NOT_FOUND'
  | 'ALREADY_REVIEWED'
  | 'HAS_DEPENDENCIES'

export class ServiceError extends Error {
  code: ServiceErrorCode
  details?: unknown

  constructor(code: ServiceErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.details = details
  }
}
