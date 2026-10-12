import { describe, expect, it } from "vitest";
import { consumePlaybackRateLimit, parsePlaybackParams } from "./security";

describe("playback request validation", () => {
  it("accepts positive finite ids and supported playback options", () => {
    const request = new Request(
      "http://localhost/api/anime/123/episodes/4/watch?type=dub&server=anizone&title=One%20Piece",
    );
    expect(parsePlaybackParams(request, { id: "123", episode: "4" })).toMatchObject({
      id: "123", episode: "4", type: "dub", server: "anizone", title: "One Piece",
    });
  });

  it.each([["0", "1"], ["1", "0"], ["9007199254740992", "1"]])(
    "rejects invalid route numbers %s/%s",
    (id, episode) => {
      expect(parsePlaybackParams(new Request("http://localhost"), { id, episode })).toBeNull();
    },
  );

  it("enforces the authenticated-user request budget", () => {
    const subject = `test-${Date.now()}-${Math.random()}`;
    for (let index = 0; index < 20; index += 1) expect(consumePlaybackRateLimit(subject)).toBe(true);
    expect(consumePlaybackRateLimit(subject)).toBe(false);
  });
});
