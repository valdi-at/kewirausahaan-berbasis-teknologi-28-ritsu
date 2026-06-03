#!/bin/sh
set -e
mkdir -p /app/public/uploads/licenses
chown -R nextjs:nodejs /app/public/uploads
exec su-exec nextjs "$@"
