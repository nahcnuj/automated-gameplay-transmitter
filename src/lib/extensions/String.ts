export const splitIntoWords = Symbol('splitIntoWords');

/**
 * Splits a string into word segments using `Intl.Segmenter`.
 *
 * @remarks
 * The implementation uses `new Intl.Segmenter(locales, { granularity: 'word' })`
 * and returns the sequence of `segment` values produced by that segmenter.
 *
 * Note: Environments without native `Intl.Segmenter` support will throw an error;
 * include a polyfill if you need to run in those environments.
 *
 * @param locales - Optional locales argument (an `Intl.LocalesArgument`) forwarded to `Intl.Segmenter`.
 *                  If omitted, the runtime's default locale(s) are used.
 *
 * @returns An array of strings where each element is a word segment as determined by the segmenter.
 *          Depending on locale and segmenter rules, segments may include punctuation or whitespace tokens;
 *          filter or normalize the results if you require only "word" tokens.
 *
 * @example
 * const words = "Hello, world!"[splitIntoWords](); // -> ["Hello", ",", " ", "world", "!"] (segmenter-dependent)
 */
String.prototype[splitIntoWords] = function (locales?: Intl.LocalesArgument) {
  return Array.from(new Intl.Segmenter(locales, { granularity: 'word' }).segment(this)).map(({ segment }) => segment);
}

declare global {
  interface String {
    [splitIntoWords](this: string, locale: Intl.Locale): string[]
  }
}