"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useTypingStore, type TestResult } from "@/lib/store";
import { getBestResults, getSyncKey } from "@/lib/results";

const DEVICE_ID_KEY = "pengutype-device-id";
const SYNCED_RESULTS_KEY_PREFIX = "pengutype-synced-result-keys";
const RESULTS_PAGE_SIZE = 1000;
const UPLOAD_ATTEMPTS = 3;
const UPLOAD_RETRY_DELAY_MS = 500;

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getSyncedKeys(userId: string): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(`${SYNCED_RESULTS_KEY_PREFIX}:${userId}`) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveSyncedKeys(userId: string, keys: Set<string>) {
  localStorage.setItem(`${SYNCED_RESULTS_KEY_PREFIX}:${userId}`, JSON.stringify([...keys]));
}

async function uploadResult(result: TestResult, deviceId: string): Promise<boolean> {
  for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
    try {
      const response = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, resultKey: getSyncKey(result), result })
      });
      if (response.ok) return true;
    } catch {
      // network error, retry
    }

    if (attempt < UPLOAD_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, UPLOAD_RETRY_DELAY_MS));
    }
  }

  console.info("[sync] upload failed after retries", getSyncKey(result));
  return false;
}

async function fetchCloudHistory(): Promise<{ results: TestResult[]; joinedAt: string | null }> {
  const results: TestResult[] = [];
  let joinedAt: string | null = null;

  for (let offset = 0; ; offset += RESULTS_PAGE_SIZE) {
    const query = new URLSearchParams({ limit: String(RESULTS_PAGE_SIZE), offset: String(offset) });
    if (offset === 0) query.set("includeMeta", "1");

    const response = await fetch(`/api/results?${query}`);
    if (!response.ok) throw new Error("Failed to fetch results");

    const data = (await response.json()) as { results: TestResult[]; joinedAt?: string | null };
    results.push(...data.results);
    if (offset === 0) joinedAt = data.joinedAt ?? null;
    if (data.results.length < RESULTS_PAGE_SIZE) break;
  }

  return { results, joinedAt };
}

/** Pulls the signed-in user's cloud bests into local history, then keeps uploading new local bests. */
export function HistoryBackupSync() {
  const results = useTypingStore((state) => state.results);
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const [pulledForUser, setPulledForUser] = useState<string | null>(null);
  const activeUserRef = useRef(userId);
  const isUploadingRef = useRef(false);
  activeUserRef.current = userId;

  // Pull once per signed-in user
  useEffect(() => {
    const { mergeResults, setCloudLastSyncedAt, setCloudJoinedAt } = useTypingStore.getState();
    setPulledForUser(null);

    if (!userId) {
      setCloudLastSyncedAt(null);
      setCloudJoinedAt(null);
      return;
    }

    let cancelled = false;

    fetchCloudHistory()
      .then(({ results: cloudResults, joinedAt }) => {
        if (cancelled) return;
        mergeResults(cloudResults);
        setCloudJoinedAt(joinedAt);

        const syncedKeys = getSyncedKeys(userId);
        cloudResults.forEach((result) => syncedKeys.add(getSyncKey(result)));
        saveSyncedKeys(userId, syncedKeys);
      })
      .catch(() => console.info("[sync] failed to fetch cloud history"))
      .finally(() => {
        if (!cancelled) setPulledForUser(userId);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Push personal bests that haven't been uploaded yet
  useEffect(() => {
    if (!userId || pulledForUser !== userId || isUploadingRef.current) return;

    const uploadPending = async () => {
      isUploadingRef.current = true;
      const deviceId = getDeviceId();
      const syncedKeys = getSyncedKeys(userId);
      let failed = false;

      try {
        // Loop so results added mid-upload are picked up too
        while (!failed && activeUserRef.current === userId) {
          const pending = getBestResults(useTypingStore.getState().results)
            .filter((result) => !syncedKeys.has(getSyncKey(result)));
          if (pending.length === 0) break;

          for (const result of pending) {
            if (await uploadResult(result, deviceId)) {
              syncedKeys.add(getSyncKey(result));
            } else {
              failed = true;
            }
          }
          saveSyncedKeys(userId, syncedKeys);
        }

        if (!failed && activeUserRef.current === userId) {
          useTypingStore.getState().setCloudLastSyncedAt(Date.now());
        }
      } finally {
        isUploadingRef.current = false;
      }
    };

    void uploadPending();
  }, [results, userId, pulledForUser]);

  return null;
}
