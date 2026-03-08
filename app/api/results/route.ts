import { NextResponse } from "next/server";
import { dbQuery } from "@/lib/db";

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

async function ensureResultsTable() {
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

  await dbQuery(`
    ALTER TABLE typing_results
    ADD COLUMN IF NOT EXISTS discord_user_id TEXT
  `);

  await dbQuery(`
    CREATE INDEX IF NOT EXISTS idx_typing_results_discord_user_id
    ON typing_results(discord_user_id)
  `);

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

  await dbQuery(`
    CREATE INDEX IF NOT EXISTS idx_typing_best_results_user
    ON typing_best_results(discord_user_id)
  `);
}

function getBucketKey(result: ResultPayload): string {
  if (result.mode === "time") {
    return `${result.mode}|${result.language}|${result.timeOption ?? result.time}`;
  }

  return `${result.mode}|${result.language}|${result.wordOption ?? ""}`;
}

function isValidResultPayload(payload: unknown): payload is ResultPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as ResultPayload;

  return (
    typeof candidate.wpm === "number" &&
    typeof candidate.rawWpm === "number" &&
    typeof candidate.accuracy === "number" &&
    typeof candidate.correctChars === "number" &&
    typeof candidate.incorrectChars === "number" &&
    typeof candidate.extraChars === "number" &&
    typeof candidate.missedChars === "number" &&
    typeof candidate.time === "number" &&
    (candidate.mode === "time" || candidate.mode === "words") &&
    typeof candidate.language === "string" &&
    typeof candidate.timestamp === "number"
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { deviceId, userId, resultKey, result } = body as {
      deviceId?: string;
      userId?: string | null;
      resultKey?: string;
      result?: unknown;
    };

    if (!deviceId || !resultKey || !isValidResultPayload(result)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    await ensureResultsTable();
    await dbQuery(
      `
      INSERT INTO typing_results (
        device_id,
        discord_user_id,
        result_key,
        wpm,
        raw_wpm,
        accuracy,
        correct_chars,
        incorrect_chars,
        extra_chars,
        missed_chars,
        test_time,
        mode,
        language,
        time_option,
        word_option,
        result_timestamp
      ) VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        $13,
        $14,
        $15,
        $16
      )
      ON CONFLICT DO NOTHING
      `,
      [
        deviceId,
        userId ?? null,
        resultKey,
        result.wpm,
        result.rawWpm,
        result.accuracy,
        result.correctChars,
        result.incorrectChars,
        result.extraChars,
        result.missedChars,
        result.time,
        result.mode,
        result.language,
        result.timeOption ?? null,
        result.wordOption ?? null,
        result.timestamp,
      ]
    );

    if (userId) {
      const bucketKey = getBucketKey(result);

      await dbQuery(
        `
        INSERT INTO typing_best_results (
          discord_user_id,
          bucket_key,
          wpm,
          raw_wpm,
          accuracy,
          correct_chars,
          incorrect_chars,
          extra_chars,
          missed_chars,
          test_time,
          mode,
          language,
          time_option,
          word_option,
          result_timestamp
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15
        )
        ON CONFLICT (discord_user_id, bucket_key) DO UPDATE
        SET
          wpm = EXCLUDED.wpm,
          raw_wpm = EXCLUDED.raw_wpm,
          accuracy = EXCLUDED.accuracy,
          correct_chars = EXCLUDED.correct_chars,
          incorrect_chars = EXCLUDED.incorrect_chars,
          extra_chars = EXCLUDED.extra_chars,
          missed_chars = EXCLUDED.missed_chars,
          test_time = EXCLUDED.test_time,
          mode = EXCLUDED.mode,
          language = EXCLUDED.language,
          time_option = EXCLUDED.time_option,
          word_option = EXCLUDED.word_option,
          result_timestamp = EXCLUDED.result_timestamp,
          updated_at = NOW()
        WHERE
          EXCLUDED.wpm > typing_best_results.wpm
          OR (
            EXCLUDED.wpm = typing_best_results.wpm
            AND EXCLUDED.raw_wpm > typing_best_results.raw_wpm
          )
          OR (
            EXCLUDED.wpm = typing_best_results.wpm
            AND EXCLUDED.raw_wpm = typing_best_results.raw_wpm
            AND EXCLUDED.accuracy > typing_best_results.accuracy
          )
          OR (
            EXCLUDED.wpm = typing_best_results.wpm
            AND EXCLUDED.raw_wpm = typing_best_results.raw_wpm
            AND EXCLUDED.accuracy = typing_best_results.accuracy
            AND EXCLUDED.result_timestamp > typing_best_results.result_timestamp
          )
        `,
        [
          userId,
          bucketKey,
          result.wpm,
          result.rawWpm,
          result.accuracy,
          result.correctChars,
          result.incorrectChars,
          result.extraChars,
          result.missedChars,
          result.time,
          result.mode,
          result.language,
          result.timeOption ?? null,
          result.wordOption ?? null,
          result.timestamp,
        ]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save result", error);
    return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");
    const userId = url.searchParams.get("userId");
    const limit = Number(url.searchParams.get("limit") ?? "200");
    const offset = Number(url.searchParams.get("offset") ?? "0");

    if (!deviceId && !userId) {
      return NextResponse.json({ error: "deviceId or userId is required" }, { status: 400 });
    }

    await ensureResultsTable();
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 1000)) : 200;
    const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;

    const queryByUser = Boolean(userId);

    const { rows: primaryRows } = await dbQuery<{
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
    }>(
      queryByUser
        ? `
          SELECT
            wpm,
            raw_wpm,
            accuracy,
            correct_chars,
            incorrect_chars,
            extra_chars,
            missed_chars,
            test_time,
            mode,
            language,
            time_option,
            word_option,
            result_timestamp
          FROM typing_best_results
          WHERE discord_user_id = $1
          ORDER BY result_timestamp DESC
          LIMIT $2
          OFFSET $3
          `
        : `
          SELECT
            wpm,
            raw_wpm,
            accuracy,
            correct_chars,
            incorrect_chars,
            extra_chars,
            missed_chars,
            test_time,
            mode,
            language,
            time_option,
            word_option,
            result_timestamp
          FROM typing_results
          WHERE device_id = $1
          ORDER BY result_timestamp DESC
          LIMIT $2
          OFFSET $3
          `,
      [queryByUser ? userId : deviceId, safeLimit, safeOffset]
    );

    const rows = primaryRows;

    if (queryByUser && rows.length === 0) {
      const { rows: fallbackRows } = await dbQuery<{
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
      }>(
        `
        WITH ranked AS (
          SELECT
            wpm,
            raw_wpm,
            accuracy,
            correct_chars,
            incorrect_chars,
            extra_chars,
            missed_chars,
            test_time,
            mode,
            language,
            time_option,
            word_option,
            result_timestamp,
            CASE
              WHEN mode = 'time' THEN mode || '|' || language || '|' || COALESCE(time_option, test_time)::TEXT
              ELSE mode || '|' || language || '|' || COALESCE(word_option, 0)::TEXT
            END AS bucket_key,
            ROW_NUMBER() OVER (
              PARTITION BY CASE
                WHEN mode = 'time' THEN mode || '|' || language || '|' || COALESCE(time_option, test_time)::TEXT
                ELSE mode || '|' || language || '|' || COALESCE(word_option, 0)::TEXT
              END
              ORDER BY wpm DESC, raw_wpm DESC, accuracy DESC, result_timestamp DESC
            ) AS rn
          FROM typing_results
          WHERE discord_user_id = $1
        )
        SELECT
          wpm,
          raw_wpm,
          accuracy,
          correct_chars,
          incorrect_chars,
          extra_chars,
          missed_chars,
          test_time,
          mode,
          language,
          time_option,
          word_option,
          result_timestamp
        FROM ranked
        WHERE rn = 1
        ORDER BY result_timestamp DESC
        LIMIT $2
        OFFSET $3
        `,
        [userId, safeLimit, safeOffset]
      );

      rows.push(...fallbackRows);
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

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Failed to fetch results", error);
    return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });
  }
}
