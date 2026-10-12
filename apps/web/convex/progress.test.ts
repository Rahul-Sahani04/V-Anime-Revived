/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const identity = { subject: "clerk-user-1", issuer: "https://usable-alien-7699.clerk.accounts.dev" };

test("repeated completion creates one history row and legacy subject rows remain visible", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(identity);

  await alice.mutation(api.progress.updateProgress, {
    anilistId: 100,
    episodeNumber: 1,
    position: 120,
    duration: 120,
    percentage: 100,
    completed: true,
    server: "senshi",
  });
  await alice.mutation(api.progress.updateProgress, {
    anilistId: 100,
    episodeNumber: 1,
    position: 120,
    duration: 120,
    percentage: 100,
    completed: true,
    server: "senshi",
  });

  const history = await alice.query(api.progress.getWatchHistory, {});
  expect(history).toHaveLength(1);

  await alice.mutation(api.library.toggleFavorite, { anilistId: 100 });
  const library = await alice.query(api.library.getLibrary, {});
  expect(library.favorites[0]?.id).toBe(100);
});

test("history ownership is enforced and malformed progress/preferences fail closed", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(identity);
  const bob = t.withIdentity({
    subject: "clerk-user-2",
    issuer: "https://usable-alien-7699.clerk.accounts.dev",
  });

  await expect(alice.mutation(api.progress.updateProgress, {
    anilistId: 100,
    episodeNumber: 1,
    position: 121,
    duration: 120,
    percentage: 100,
    completed: true,
  })).rejects.toThrow();
  await expect(alice.mutation(api.preferences.updateUserPreferences, {
    preferredLanguage: "invalid",
  })).rejects.toThrow();

  await alice.mutation(api.progress.updateProgress, {
    anilistId: 100,
    episodeNumber: 1,
    position: 120,
    duration: 120,
    percentage: 100,
    completed: true,
  });
  const history = await alice.query(api.progress.getWatchHistory, {});
  await bob.mutation(api.progress.removeHistoryItem, { historyId: history[0].historyId });
  expect(await alice.query(api.progress.getWatchHistory, {})).toHaveLength(1);
});

test("guest progress batches are capped", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(identity);
  const items = Array.from({ length: 101 }, (_, index) => ({
    anilistId: index + 1,
    episodeNumber: 1,
    position: 1,
    duration: 10,
    percentage: 10,
    completed: false,
    lastWatchedAt: index + 1,
  }));

  await expect(alice.mutation(api.progress.syncGuestProgress, { items })).rejects.toThrow();
});

test("large dismiss is bounded, scheduled, and user-scoped", async () => {
  vi.useFakeTimers();
  try {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity(identity);
    const bob = t.withIdentity({
      subject: "clerk-user-2",
      issuer: "https://usable-alien-7699.clerk.accounts.dev",
    });

    for (let episodeNumber = 1; episodeNumber <= 101; episodeNumber++) {
      await alice.mutation(api.progress.updateProgress, {
        anilistId: 777,
        episodeNumber,
        position: 1,
        duration: 10,
        percentage: 10,
        completed: false,
      });
    }
    await bob.mutation(api.progress.updateProgress, {
      anilistId: 777,
      episodeNumber: 1,
      position: 1,
      duration: 10,
      percentage: 10,
      completed: false,
    });

    const result = await alice.mutation(api.progress.dismissWatchProgress, { anilistId: 777 });
    expect(result).toMatchObject({ success: true, scheduled: true });
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(await alice.query(api.progress.getContinueWatching, {})).toHaveLength(0);
    expect(await bob.query(api.progress.getContinueWatching, {})).toHaveLength(1);
  } finally {
    vi.useRealTimers();
  }
});
