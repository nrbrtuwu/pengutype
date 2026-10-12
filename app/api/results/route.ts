import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbQuery } from "@/lib/db";
import { getBucketKey } from "@/lib/results";

type ResultPayload = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  time: number;
  mode: "time" | "words";
  language: string;
  timeOption?: number;
  wordOption?: number;
  timestamp: number;
};

type ResultRow = {
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  correct_chars: number;
  incorrect_chars: number;
  extra_chars: number;
  missed_chars: number;
  test_time: number;
  mode: "time" | "words";
  language: string;
  time_option: number | null;
  word_option: number | null;
  result_timestamp: string | number;
};

const RESULT_COLUMNS = [
  "wpm",
  "raw_wpm",
  "accuracy",
  "correct_chars",
  "incorrect_chars",
  "extra_chars",
  "missed_chars",
  "test_time",
  "mode",
  "language",
  "time_option",
  "word_option",
  "result_timestamp",
];
const RESULT_COLUMNS_SQL = RESULT_COLUMNS.join(", ");

function placeholders(count: number, start = 1) {
  return Array.from({ length: count }, (_, i) => `$${start + i}`).join(", ");
}

let schemaReady: Promise<void> | null = null;

function ensureSchema() {
  schemaReady ??= (async () => {
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS typing_results (
        id BIGSERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        result_key TEXT NOT NULL,
        wpm INTEGER NOT NULL,
        raw_wpm INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        correct_chars INTEGER NOT NULL,
        incorrect_chars INTEGER NOT NULL,
        extra_chars INTEGER NOT NULL,
        missed_chars INTEGER NOT NULL,
        test_time INTEGER NOT NULL,
        mode TEXT NOT NULL,
        language TEXT NOT NULL,
        time_option INTEGER,
        word_option INTEGER,
        result_timestamp BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(device_id, result_key)
      )
    `);
    await dbQuery(`ALTER TABLE typing_results ADD COLUMN IF NOT EXISTS discord_user_id TEXT`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_typing_results_discord_user_id ON typing_results(discord_user_id)`);
    await dbQuery(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_typing_results_user_result_key
      ON typing_results(discord_user_id, result_key)
      WHERE discord_user_id IS NOT NULL
    `);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS typing_best_results (
        id BIGSERIAL PRIMARY KEY,
        discord_user_id TEXT NOT NULL,
        bucket_key TEXT NOT NULL,
        wpm INTEGER NOT NULL,
        raw_wpm INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        correct_chars INTEGER NOT NULL,
        incorrect_chars INTEGER NOT NULL,
        extra_chars INTEGER NOT NULL,
        missed_chars INTEGER NOT NULL,
        test_time INTEGER NOT NULL,
        mode TEXT NOT NULL,
        language TEXT NOT NULL,
        time_option INTEGER,
        word_option INTEGER,
        result_timestamp BIGINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(discord_user_id, bucket_key)
      )
    `);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_typing_best_results_user ON typing_best_results(discord_user_id)`);
  })().catch((error) => {
    // allow a retry on the next request
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}

async function getSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id || null;
}

function isValidResultPayload(payload: unknown): payload is ResultPayload {
  if (!payload || typeof payload !== "object") return false;

  const candidate = payload as Record<string, unknown>;
  const numericFields = ["wpm", "rawWpm", "accuracy", "correctChars", "incorrectChars", "extraChars", "missedChars", "time", "timestamp"];

  return (
    numericFields.every((field) => typeof candidate[field] === "number") &&
    (candidate.mode === "time" || candidate.mode === "words") &&
    typeof candidate.language === "string"
  );
}

export async function POST(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { deviceId, resultKey, result } = (await request.json()) as {
      deviceId?: string;
      resultKey?: string;
      result?: unknown;
    };

    if (!deviceId || !resultKey || !isValidResultPayload(result)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const values = [
      result.wpm,
      result.rawWpm,
      result.accuracy,
      result.correctChars,
      result.incorrectChars,
      result.extraChars,
      result.missedChars,
      Math.max(0, Math.round(result.time)),
      result.mode,
      result.language,
      result.timeOption ?? null,
      result.wordOption ?? null,
      result.timestamp,
    ];

    await ensureSchema();
    await dbQuery(
      `INSERT INTO typing_results (device_id, discord_user_id, result_key, ${RESULT_COLUMNS_SQL})
       VALUES (${placeholders(3 + values.length)})
       ON CONFLICT DO NOTHING`,
      [deviceId, userId, resultKey, ...values]
    );

    // Keep the best result per bucket: compare wpm, then raw wpm, then accuracy, then recency
    const updates = [...RESULT_COLUMNS, "updated_at"]
      .map((column) => (column === "updated_at" ? "updated_at = NOW()" : `${column} = EXCLUDED.${column}`))
      .join(", ");

    await dbQuery(
      `INSERT INTO typing_best_results (discord_user_id, bucket_key, ${RESULT_COLUMNS_SQL})
       VALUES (${placeholders(2 + values.length)})
       ON CONFLICT (discord_user_id, bucket_key) DO UPDATE SET ${updates}
       WHERE (EXCLUDED.wpm, EXCLUDED.raw_wpm, EXCLUDED.accuracy, EXCLUDED.result_timestamp)
           > (typing_best_results.wpm, typing_best_results.raw_wpm, typing_best_results.accuracy, typing_best_results.result_timestamp)`,
      [userId, getBucketKey(result), ...values]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save result", error);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const includeMeta = url.searchParams.get("includeMeta") === "1";
    const limit = Number(url.searchParams.get("limit") ?? "200");
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 1000)) : 200;
    const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;

    await ensureSchema();

    let { rows } = await dbQuery<ResultRow>(
      `SELECT ${RESULT_COLUMNS_SQL}
       FROM typing_best_results
       WHERE discord_user_id = $1
       ORDER BY result_timestamp DESC
       LIMIT $2 OFFSET $3`,
      [userId, safeLimit, safeOffset]
    );

    // Users from before typing_best_results existed: derive bests from raw history
    if (rows.length === 0) {
      const bucketSql = `CASE
        WHEN mode = 'time' THEN mode || '|' || language || '|' || COALESCE(time_option, test_time)::TEXT
        ELSE mode || '|' || language || '|' || COALESCE(word_option, 0)::TEXT
      END`;

      ({ rows } = await dbQuery<ResultRow>(
        `SELECT ${RESULT_COLUMNS_SQL}
         FROM (
           SELECT ${RESULT_COLUMNS_SQL},
             ROW_NUMBER() OVER (
               PARTITION BY ${bucketSql}
               ORDER BY wpm DESC, raw_wpm DESC, accuracy DESC, result_timestamp DESC
             ) AS rn
           FROM typing_results
           WHERE discord_user_id = $1
         ) ranked
         WHERE rn = 1
         ORDER BY result_timestamp DESC
         LIMIT $2 OFFSET $3`,
        [userId, safeLimit, safeOffset]
      ));
    }

    const results = rows.map((row) => ({
      wpm: row.wpm,
      rawWpm: row.raw_wpm,
      accuracy: row.accuracy,
      correctChars: row.correct_chars,
      incorrectChars: row.incorrect_chars,
      extraChars: row.extra_chars,
      missedChars: row.missed_chars,
      time: row.test_time,
      mode: row.mode,
      language: row.language,
      timeOption: row.time_option ?? undefined,
      wordOption: row.word_option ?? undefined,
      timestamp: Number(row.result_timestamp)
    }));

    let joinedAt: string | null = null;

    if (includeMeta) {
      const { rows: joinedRows } = await dbQuery<{ joined_at: string | Date | null }>(
        `SELECT LEAST(
           (SELECT MIN(created_at) FROM typing_results WHERE discord_user_id = $1),
           (SELECT MIN(created_at) FROM typing_best_results WHERE discord_user_id = $1)
         ) AS joined_at`,
        [userId]
      );

      const rawJoinedAt = joinedRows[0]?.joined_at;
      if (rawJoinedAt) {
        joinedAt = new Date(rawJoinedAt).toISOString();
      }
    }

    return NextResponse.json({ results, joinedAt });
  } catch (error) {
    console.error("Failed to fetch results", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
