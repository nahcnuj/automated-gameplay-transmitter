export type CommentData = { data: Record<string, unknown> };

export interface AgentLike {
    // Agent can generate spoken output (speech-to-audio enabled)
    canSpeak: boolean;

    // Current game state / currently played game data
    currentGame?: unknown;

    // Global stream state payload (e.g. live status, viewer count, metadata)
    streamState?: unknown;

    onAir: (state: unknown) => void;
    listen: (comments: CommentData[]) => void;
};

export type SpeechState = {
    speech: string;
    silent: boolean;
};

export interface AgentApi {
    getSpeech(): SpeechState;
    setSpeech(speech: string): void;
    getGame(): unknown;
    getStreamState(): unknown;
    publishStreamState(payload: unknown): void;
    postComments(comments: CommentData[]): void;
};

export function createAgentApi(agent: AgentLike, initialSpeechState: SpeechState = { speech: '', silent: false }): AgentApi {
    let currentSpeechState = initialSpeechState;

    return {
        getSpeech() {
            return currentSpeechState;
        },

        setSpeech(speech: string) {
            currentSpeechState = {
                speech,
                silent: !agent.canSpeak,
            };
        },

        getGame() {
            return agent.currentGame;
        },

        getStreamState() {
            return agent.streamState;
        },

        publishStreamState(payload: unknown) {
            agent.onAir(payload);
        },

        postComments(comments: CommentData[]) {
            agent.listen(comments);
        },
    };
};
