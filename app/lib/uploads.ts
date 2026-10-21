import 'server-only'
import path from 'path'

// Shared by app/uploads/[...path]/route.ts and the desktop API license endpoint.

export const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

export const CONTENT_TYPES: Record<string, string> = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.heic': 'image/heic',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.mov':  'video/quicktime',
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
  '.ogg':  'audio/ogg',
  '.oga':  'audio/ogg',
  '.wav':  'audio/wav',
  '.weba': 'audio/webm',
}

export function contentTypeFor(filePath: string) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
}

// Resolves path segments inside public/uploads. Returns null if they escape it.
export function resolveUploadPath(segments: string[]): string | null {
  const filePath = path.resolve(UPLOADS_DIR, ...segments)
  if (!filePath.startsWith(UPLOADS_DIR + path.sep) && filePath !== UPLOADS_DIR) return null
  return filePath
}

// The public URL path of a resolved file, e.g. /uploads/licenses/x.jpg.
// Matches what's stored in driver_applications.driving_license_image.
export function uploadUrlPath(filePath: string) {
  return '/uploads/' + path.relative(UPLOADS_DIR, filePath).split(path.sep).join('/')
}

// Turns a stored URL path (/uploads/licenses/x.jpg) back into a file path, or null.
export function resolveStoredUpload(urlPath: string): string | null {
  if (!urlPath.startsWith('/uploads/')) return null
  return resolveUploadPath(urlPath.slice('/uploads/'.length).split('/'))
}
