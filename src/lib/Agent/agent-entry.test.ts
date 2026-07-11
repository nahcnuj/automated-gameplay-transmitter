import { describe, expect, it } from "bun:test";
import { createAgentApi } from "../../../index.agent";

/**
 * Smoke test: agent entry only exposes createAgentApi and does not import
 * server IPC or React UI modules (those live on other package exports).
 */
describe("index.agent entry", () => {
  it("exports createAgentApi that wraps AgentLike", () => {
    const listenCalls: unknown[] = [];
    const api = createAgentApi({
      canSpeak: true,
      currentGame: null,
      streamState: { type: "live" },
      onAir: () => {},
      listen: (c) => { listenCalls.push(c); },
    });

    api.postComments([{ data: { comment: "hi" } }]);
    expect(listenCalls).toHaveLength(1);
    expect(api.getStreamState()).toEqual({ type: "live" });
  });
});
