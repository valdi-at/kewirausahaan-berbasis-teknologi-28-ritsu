import { ApiError } from '@/app/lib/api/errors'
import { fail } from '@/app/lib/api/respond'

// Unknown paths under /api/desktop/v1 get a JSON 404 instead of the HTML not-found page.
function notFound() {
  return fail(new ApiError('NOT_FOUND', 'Endpoint not found.'))
}

export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE }
