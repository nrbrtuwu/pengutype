"use client";

import { useEffect, useRef } from "react";
import { useTypingStore, type TestResult } from "@/lib/store";
import { useSession } from "next-auth/react";

const DEVICE_ID_KEY = "pengutype-device-id";
const SYNCED_RESULTS_KEY_PREFIX = "pengutype-synced-result-keys";
const RESULTS_PAGE_SIZE = 1000;
const SYNC_RETRY_COUNT = 3;
const SYNC_RETRY_DELAY_MS = 500;

function logSync(message: string, data?: unknown) {
  if (data !== undefined) {
    console.info(`[sync] ${message}`, data);
    return;
  }

  console.info(`[sync] ${message}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getDeviceId() {
  if (typeof window === "undefined") return "";

  const existingId = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existingId) {
    return existingId;
  }

  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

function getSyncedStorageKey(userId: string): string {
  return `${SYNCED_RESULTS_KEY_PREFIX}:${userId}`;
}

function getSyncedKeys(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.localStorage.getItem(getSyncedStorageKey(userId));
    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveSyncedKeys(userId: string, keys: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getSyncedStorageKey(userId), JSON.stringify([...keys]));
}

function resultToKey(result: TestResult): string {
  return [
    result.timestamp,
    result.mode,
    result.language,
    result.timeOption ?? "",
    result.wordOption ?? "",
    result.wpm,
    result.rawWpm,
    result.accuracy,
    result.correctChars,
    result.incorrectChars,
    result.extraChars,
    result.missedChars,
    result.time
  ].join("|");
}

async function postResultWithRetry(payload: {
  deviceId: string;
  userId: string;
  resultKey: string;
  result: TestResult;
}): Promise<boolean> {
  for (let attempt = 0; attempt < SYNC_RETRY_COUNT; attempt++) {
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (attempt > 0) {
          logSync("upload succeeded after retry", { resultKey: payload.resultKey, attempt: attempt + 1 });
        }
        return true;
      }

      logSync("upload attempt failed", {
        resultKey: payload.resultKey,
        attempt: attempt + 1,
        status: response.status
      });
    } catch {
      logSync("upload attempt threw", { resultKey: payload.resultKey, attempt: attempt + 1 });
    }

    if (attempt < SYNC_RETRY_COUNT - 1) {
      await sleep(SYNC_RETRY_DELAY_MS);
    }
  }

  logSync("upload failed after retries", { resultKey: payload.resultKey });
  return false;
}

async function fetchAllCloudResults(params: { userId?: string; deviceId?: string }): Promise<TestResult[]> {
  const allResults: TestResult[] = [];
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({
      limit: RESULTS_PAGE_SIZE.toString(),
      offset: offset.toString()
    });

    if (params.userId) {
      query.set("userId", params.userId);
    } else if (params.deviceId) {
      query.set("deviceId", params.deviceId);
    }

    const response = await fetch(`/api/results?${query.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch results");
    }

    const data = (await response.json()) as { results?: TestResult[] };
    const pageResults = data.results ?? [];

    allResults.push(...pageResults);

    if (pageResults.length < RESULTS_PAGE_SIZE) {
      break;
    }

    offset += RESULTS_PAGE_SIZE;
  }

  return allResults;
}

function isBetterResult(candidate: TestResult, current: TestResult): boolean {
  if (candidate.wpm !== current.wpm) {
    return candidate.wpm > current.wpm;
  }

  if (candidate.rawWpm !== current.rawWpm) {
    return candidate.rawWpm > current.rawWpm;
  }

  if (candidate.accuracy !== current.accuracy) {
    return candidate.accuracy > current.accuracy;
  }

  return candidate.timestamp > current.timestamp;
}

function getResultBucketKey(result: TestResult): string {
  if (result.mode === "time") {
    return `${result.mode}|${result.language}|${result.timeOption ?? result.time}`;
  }

  return `${result.mode}|${result.language}|${result.wordOption ?? ""}`;
}

function getBestResults(results: TestResult[]): TestResult[] {
  const map = new Map<string, TestResult>();

  for (const result of results) {
    const bucketKey = getResultBucketKey(result);
    const existing = map.get(bucketKey);

    if (!existing || isBetterResult(result, existing)) {
      map.set(bucketKey, result);
    }
  }

  return [...map.values()];
}

type HistoryBackupSyncProps = {
  onInitialSyncComplete?: () => void;
};

export function HistoryBackupSync({ onInitialSyncComplete }: HistoryBackupSyncProps) {
  const { results, setCloudSyncState, mergeResults } = useTypingStore();
  const { data: session, status: sessionStatus } = useSession();
  const isSyncingRef = useRef(false);
  const startupSyncRunningRef = useRef(false);
  const startupSyncReadyRef = useRef(false);
  const startupIdentityRef = useRef<string | null>(null);
  const startupNotifyRef = useRef(false);

  const markStartupReady = () => {
    if (startupNotifyRef.current) {
      return;
    }

    startupNotifyRef.current = true;
    startupSyncReadyRef.current = true;
    onInitialSyncComplete?.();
  };

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    const userId = session?.user?.id ?? null;
    if (!userId) {
      setCloudSyncState("idle", 0);
      markStartupReady();
      return;
    }

    const deviceId = getDeviceId();
    if (!deviceId) {
      markStartupReady();
      return;
    }

    const syncIdentity = `user:${userId}`;

    if (startupIdentityRef.current === syncIdentity && startupSyncReadyRef.current) {
      markStartupReady();
      return;
    }

    startupNotifyRef.current = false;
    startupSyncReadyRef.current = false;
    startupIdentityRef.current = syncIdentity;

    let cancelled = false;

    if (startupSyncRunningRef.current) {
      return;
    }

    const runInitialSync = async () => {
      startupSyncRunningRef.current = true;
      logSync("initial sync started", { userId });

      try {
        const cloudResults = await fetchAllCloudResults({ userId });
        if (cancelled) {
          return;
        }

        const syncedKeys = getSyncedKeys(userId);

        if (cloudResults.length > 0) {
          mergeResults(cloudResults);
          for (const result of cloudResults) {
            syncedKeys.add(resultToKey(result));
          }
          saveSyncedKeys(userId, syncedKeys);
        }

        logSync("initial cloud hydration complete", { fetched: cloudResults.length });

        const resultsToSync = getBestResults(useTypingStore.getState().results).filter(
          (result) => !syncedKeys.has(resultToKey(result))
        );

        logSync("initial upload queue prepared", { pending: resultsToSync.length });

        setCloudSyncState(resultsToSync.length > 0 ? "syncing" : "synced", resultsToSync.length);

        for (const result of resultsToSync) {
          if (cancelled) {
            return;
          }

          const resultKey = resultToKey(result);
          const didUpload = await postResultWithRetry({
            deviceId,
            userId,
            resultKey,
            result
          });

          if (!didUpload) {
            continue;
          }

          syncedKeys.add(resultKey);
          const bestPendingCount = getBestResults(useTypingStore.getState().results).filter(
            (item) => !syncedKeys.has(resultToKey(item))
          ).length;
          setCloudSyncState(bestPendingCount > 0 ? "syncing" : "synced", bestPendingCount);
        }

        saveSyncedKeys(userId, syncedKeys);
        const finalPendingCount = getBestResults(useTypingStore.getState().results).filter(
          (item) => !syncedKeys.has(resultToKey(item))
        ).length;

        if (finalPendingCount > 0) {
          setCloudSyncState("syncing", finalPendingCount);
          logSync("initial sync has pending uploads", { pending: finalPendingCount });
        } else {
          setCloudSyncState("synced", 0);
          logSync("initial sync finished");
        }
      } catch {
        if (!cancelled) {
          const pendingCount = getBestResults(useTypingStore.getState().results).filter(
            (result) => !getSyncedKeys(userId).has(resultToKey(result))
          ).length;
          setCloudSyncState(pendingCount > 0 ? "syncing" : "idle", pendingCount);
          logSync("initial sync encountered error", { pending: pendingCount });
        }
      } finally {
        startupSyncRunningRef.current = false;
        if (!cancelled) {
          markStartupReady();
        }
      }
    };

    void runInitialSync();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, session?.user?.id, mergeResults, setCloudSyncState, onInitialSyncComplete]);

  useEffect(() => {
    if (!startupSyncReadyRef.current || startupSyncRunningRef.current) {
      return;
    }

    if (sessionStatus !== "authenticated") {
      setCloudSyncState("idle", 0);
      return;
    }

    const userId = session?.user?.id ?? null;
    if (!userId) {
      setCloudSyncState("idle", 0);
      return;
    }

    const bestResults = getBestResults(results);

    if (bestResults.length === 0 || isSyncingRef.current) {
      if (bestResults.length === 0) {
        setCloudSyncState("idle", 0);
      }
      return;
    }

    let cancelled = false;

    const syncResults = async () => {
      const deviceId = getDeviceId();
      if (!deviceId) return;

      isSyncingRef.current = true;
      const syncedKeys = getSyncedKeys(userId);
      const initialPending = bestResults.filter((result) => !syncedKeys.has(resultToKey(result))).length;
      setCloudSyncState(initialPending > 0 ? "syncing" : "synced", initialPending);

      if (initialPending > 0) {
        logSync("background sync started", { pending: initialPending });
      }

      try {
        for (const result of bestResults) {
          if (cancelled) return;

          const resultKey = resultToKey(result);
          if (syncedKeys.has(resultKey)) {
            continue;
          }

          const didUpload = await postResultWithRetry({
            deviceId,
            userId,
            resultKey,
            result
          });

          if (!didUpload) {
            continue;
          }

          syncedKeys.add(resultKey);
          const pendingCount = bestResults.filter((item) => !syncedKeys.has(resultToKey(item))).length;
          setCloudSyncState(pendingCount > 0 ? "syncing" : "synced", pendingCount);
        }
      } finally {
        saveSyncedKeys(userId, syncedKeys);
        const finalPending = bestResults.filter((result) => !syncedKeys.has(resultToKey(result))).length;
        if (finalPending > 0) {
          setCloudSyncState("syncing", finalPending);
          logSync("background sync still pending", { pending: finalPending });
        } else {
          setCloudSyncState("synced", 0);
          if (initialPending > 0) {
            logSync("background sync finished");
          }
        }
        isSyncingRef.current = false;
      }
    };

    void syncResults();

    return () => {
      cancelled = true;
    };
  }, [results, setCloudSyncState, sessionStatus, session?.user?.id]);

  return null;
}
