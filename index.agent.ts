/**
 * Side-effect-free Agent API entry.
 *
 * Import this path when you only need `createAgentApi` / Agent types and must
 * avoid loading React UI components or Node IPC (`./server`).
 *
 * @example
 * ```ts
 * import { createAgentApi } from "automated-gameplay-transmitter/agent";
 * ```
 */
export * from "./src/lib/Agent";
