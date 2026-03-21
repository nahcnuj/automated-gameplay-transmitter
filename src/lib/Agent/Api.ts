/**
 * Agent comment payload, wrapped in a data object.
 * @typedef {Object} AgentComment
 * @property {Record<string, unknown>} data - The comment payload data.
 */
export type AgentComment = { data: Record<string, unknown> }

/**
 * Agent implementation required by the API adapter.
 * @interface AgentLike
 */
export interface AgentLike {
  /** Agent can generate spoken output (speech-to-audio enabled). */
  canSpeak: boolean

  /** Current game state / currently played game data. */
  currentGame?: unknown

  /** Global stream state payload (e.g. live status, viewer count, metadata). */
  streamState?: unknown

  /** Sends an updated stream state event to the host. */
  onAir: (state: unknown) => void

  /** Forwards received comments to the agent. */
  listen: (comments: AgentComment[]) => void
}

/**
 * Represents the current speech state in the agent API.
 * @typedef {Object} SpeechState
 * @property {string} speech - Text that is currently being spoken.
 * @property {boolean} silent - Whether speech is disabled due to `canSpeak` false.
 */
export type SpeechState = {
  speech: string
  silent: boolean
}

/**
 * Public Agent API methods exposed to consumers.
 * @interface AgentApi
 */
export interface AgentApi {
  /** Get the current speech state. */
  getSpeech(): SpeechState

  /** Set the current speech text. */
  setSpeech(speech: string): void

  /** Get the current game state. */
  getGame(): unknown

  /** Get the current global stream state. */
  getStreamState(): unknown

  /** Publish updated stream state to the agent host. */
  publishStreamState(payload: unknown): void

  /** Post comments into the agent's listener. */
  postComments(comments: AgentComment[]): void
}

/**
 * Create an API adapter for an AgentLike instance.
 *
 * @param {AgentLike} agent - The engine-specific agent object.
 * @param {string} [initialSpeech=''] - Initial speech string.
 * @returns {AgentApi} The adapter API.
 */
export function createAgentApi(agent: AgentLike, initialSpeech: string = ''): AgentApi {
  let currentSpeechState: SpeechState = {
    speech: initialSpeech,
    silent: !agent.canSpeak,
  }

  return {
    getSpeech() {
      return { ...currentSpeechState }
    },

    setSpeech(speech: string) {
      currentSpeechState = {
        speech,
        silent: !agent.canSpeak,
      }
    },

    getGame() {
      return agent.currentGame
    },

    getStreamState() {
      return agent.streamState
    },

    publishStreamState(payload: unknown) {
      agent.onAir(payload)
    },

    postComments(comments: AgentComment[]) {
      agent.listen(comments)
    },
  }
}
