import { Pool, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __pengutypePgPool: Pool | undefined;
}

function getPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!global.__pengutypePgPool) {
    const isLocalDatabase =
      databaseUrl.includes("localhost") ||
      databaseUrl.includes("127.0.0.1") ||
      databaseUrl.includes("@db:");

    global.__pengutypePgPool = new Pool({
      connectionString: databaseUrl,
      ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
      max: 10,
    });
  }

  return global.__pengutypePgPool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
) {
  const pool = getPool();
  return pool.query<T>(text, params);
}
