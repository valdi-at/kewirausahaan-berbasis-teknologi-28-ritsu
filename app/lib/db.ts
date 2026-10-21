import 'server-only'
import { Pool, type PoolClient, type QueryResultRow } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
})

export const db = {
  query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
    pool.query<T>(text, params),
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally {
    client.release()
  }
}

// Escape a user search term for ILIKE ... ESCAPE '\'
export function escapeLike(term: string) {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`)
}
