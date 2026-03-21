export type AgentComment = { data: Record<string, unknown> }

export interface AgentLike {
  // Agent can generate spoken output (speech-to-audio enabled)
  canSpeak: boolean

  // Current game state / currently played game data
  currentGame?: unknown

  // Global stream state payload (e.g. live status, viewer count, metadata)
  streamState?: unknown

  onAir: (state: unknown) => void
  listen: (comments: AgentComment[]) => void
}

export type SpeechState = {
  speech: string
  silent: boolean
}

export interface AgentApi {
  getSpeech(): SpeechState
  setSpeech(speech: string): void
  getGame(): unknown
  getStreamState(): unknown
  publishStreamState(payload: unknown): void
  postComments(comments: AgentComment[]): void
}

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
