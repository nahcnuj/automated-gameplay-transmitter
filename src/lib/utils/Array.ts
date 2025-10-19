/**
 * Splits an array into consecutive chunks (sublists) of up to `n` elements each.
 *
 * The input array is not mutated; a new array of arrays is returned. The original
 * element order is preserved. All chunks except possibly the last will have length
 * exactly `n`; the last chunk contains the remaining elements and may be shorter.
 *
 * @param arr - The array to split. Can be a readonly array; elements are referenced, not cloned.
 * @param n - Maximum number of elements per chunk. Must be a positive integer.
 * @returns An array of chunks. If `arr` is empty, an empty array is returned.
 *
 * @example
 * // returns [[1, 2], [3, 4], [5]]
 * sliceByNumber([1, 2, 3, 4, 5], 2);
 *
 * @example
 * // returns [['a', 'b', 'c']]
 * sliceByNumber(['a', 'b', 'c'], 10);
 *
 * @throws {RangeError} If `n` is not a positive integer (e.g. 0, negative, or non-finite),
 *         the implementation may fail when allocating internal structures.
 * 
 * @see {@link https://yucatio.hatenablog.com/entry/2019/12/10/222311|JavaScriptでn個ずつ配列を分割する - yucatio@システムエンジニア}
 */
export const sliceByNumber = <T>(arr: readonly T[], n: number): T[][] =>
  new Array(Math.ceil(arr.length / n))
    .keys()
    .map((_, i) => arr.slice(i * n, i * n + n))
    .toArray();
