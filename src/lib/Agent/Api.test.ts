import { describe, expect, it } from "bun:test";
import { createAgentApi } from "./Api";

const createAgent = () => {
  const onAirCalls: unknown[] = [];
  const listenCalls: unknown[] = [];

  return {
    canSpeak: true,
    currentGame: { name: "game1", state: { x: 1 } },
    streamState: { type: "live" },
    onAir: (payload: unknown) => onAirCalls.push(payload),
    listen: (comments: unknown) => listenCalls.push(comments),
    _onAirCalls: onAirCalls,
    _listenCalls: listenCalls,
  };
};

describe("Agent API", () => {
  it("should return game and meta from agent", () => {
    const agent = createAgent();
    const api = createAgentApi(agent);

    expect(api.getGame()).toEqual(agent.currentGame);
    expect(api.getStreamState()).toEqual(agent.streamState);
  });

  it("should update and get speech state via setSpeech/getSpeech", () => {
    const agent = createAgent();
    const api = createAgentApi(agent, { speech: "", silent: true });

    api.setSpeech("hello");
    expect(api.getSpeech()).toEqual({ speech: "hello", silent: false });
  });

  it("should forward postComments to agent.listen", () => {
    const agent = createAgent();
    const api = createAgentApi(agent);
    const comments = [{ data: { comment: "hi" } }];

    api.postComments(comments);
    expect(agent._listenCalls[0]).toEqual(comments);
  });

  it("should forward publishStreamState to agent.onAir", () => {
    const agent = createAgent();
    const api = createAgentApi(agent);
    const payload = { type: "niconama", data: { isLive: true } };

    api.publishStreamState(payload);
    expect(agent._onAirCalls[0]).toEqual(payload);
  });
});
