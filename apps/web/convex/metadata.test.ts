/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
afterEach(() => vi.restoreAllMocks());

test("fresh cached metadata is returned without fetching upstream", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("animeCache", {
      anilistId: 20, title: { english: "Cache fixture" }, posterUrl: "",
      genres: [], episodes: 12, status: "RELEASING", updatedAt: Date.now(),
    });
  });
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected fetch"));
  const result = await t.action(api.anilist.getAnimeDetails, { id: 20 });
  expect(result.title.english).toBe("Cache fixture");
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("expired releasing metadata refreshes and persists in isolated cache", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("animeCache", {
      anilistId: 20, title: { english: "Old fixture" }, posterUrl: "",
      genres: [], episodes: 12, status: "RELEASING", updatedAt: Date.now() - 86_400_001,
    });
  });
  const fetchSpy = vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { Media: null } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({
    data: { id: "20", attributes: { titles: { en: "New fixture" }, status: "current", episodeCount: 13 } },
    }), { status: 200 }));
  expect((await t.action(api.anilist.getAnimeDetails, { id: 20 })).title.english).toBe("New fixture");
  expect((await t.query(api.anilist.getCachedAnime, { anilistId: 20 }))?.episodes).toBe(13);
  expect(fetchSpy).toHaveBeenCalledTimes(2);
  await t.action(api.anilist.getAnimeDetails, { id: 20 });
  expect(fetchSpy).toHaveBeenCalledTimes(2);
});

// Opt-in only. Real public metadata APIs; Convex persistence stays in memory.
const live = test.skipIf(process.env.RUN_LIVE_METADATA !== "1");
function boundLiveFetch() {
  const realFetch = globalThis.fetch.bind(globalThis);
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => realFetch(input, {
    ...init, signal: AbortSignal.timeout(15_000),
  }));
}

live("live website search result retains its title through detail fetch and cache", async () => {
  boundLiveFetch();
  const t = convexTest(schema, modules);
  const results = await t.action(api.anilist.searchAnime, { query: "Naruto" });
  expect(results.length).toBeGreaterThan(0);
  const selected = results.find((item: { title: { english?: string; romaji?: string } }) =>
    (item.title.english || item.title.romaji || "").toLowerCase() === "naruto");
  expect(selected).toBeDefined();
  const detail = await t.action(api.anilist.getAnimeDetails, { id: selected.id });
  expect(detail.title.english || detail.title.romaji).toBe(selected.title.english || selected.title.romaji);
  expect((await t.query(api.anilist.getCachedAnime, { anilistId: selected.id }))?.title).toEqual(detail.title);
}, 60_000);

live("existing AniList Naruto ID 20 still resolves to Naruto", async () => {
  boundLiveFetch();
  const t = convexTest(schema, modules);
  const detail = await t.action(api.anilist.getAnimeDetails, { id: 20 });
  expect(detail?.title?.english || detail?.title?.romaji).toBe("Naruto");
}, 60_000);

live("live home feed returns nonempty shelves", async () => {
  boundLiveFetch();
  const t = convexTest(schema, modules);
  const feed = await t.action(api.anilist.getHomeFeed, {});
  expect(feed.trending.length).toBeGreaterThan(0);
  expect(feed.popular.length).toBeGreaterThan(0);
  expect(feed.topRated.length).toBeGreaterThan(0);
}, 60_000);
