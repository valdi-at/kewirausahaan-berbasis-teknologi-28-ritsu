#!/bin/sh
set -e

psql "$DATABASE_URL" <<'SQL'
CREATE TABLE IF NOT EXISTS _migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
SQL

for file in $(ls /app/migrations/*.sql | sort); do
  name=$(basename "$file")

  exists=$(psql "$DATABASE_URL" -tAc "SELECT 1 FROM _migrations WHERE name = '$name'")
  if [ "$exists" = "1" ]; then
    echo "skip  $name"
    continue
  fi

  echo "apply $name"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$file"
  psql "$DATABASE_URL" -c "INSERT INTO _migrations (name) VALUES ('$name')"
done

echo "migrations done"
