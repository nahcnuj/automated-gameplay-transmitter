import ElizaCore from "eliza-ja-js/ElizaCore";
import Doctor from "eliza-ja-js/doctor-ja.json";

const eliza = new ElizaCore(Doctor);

/** */
/**
 * Generates a response to the given input text using the Eliza chatbot algorithm.
 *
 * @param text - The input string to be processed by Eliza.
 * @returns The chatbot's reply as a string.
 */
export const reply = (text: string) => eliza.transform(text);