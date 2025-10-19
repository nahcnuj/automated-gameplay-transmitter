import { describe, expect, test } from 'bun:test';
import { sliceByNumber } from './Array';

describe('sliceByNumber', () => {
  test('returns empty array for empty input', () => {
    expect(sliceByNumber([], 3)).toEqual([]);
  });

  test('splits array into chunks of given size with remainder', () => {
    const actual = sliceByNumber([1, 2, 3, 4, 5], 2);
    expect(actual).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('returns single chunk when n >= length', () => {
    expect(sliceByNumber([1, 2, 3], 3)).toEqual([[1, 2, 3]]);
    expect(sliceByNumber([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  test('returns each element in its own array when n = 1', () => {
    expect(sliceByNumber([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  test('does not mutate the original array', () => {
    const input = [1, 2, 3];
    const copy = [...input];
    sliceByNumber(input, 2);
    expect(input).toEqual(copy);
  });

  test('throws for non-positive n', () => {
    expect(() => sliceByNumber([1, 2, 3], 0)).toThrow(RangeError);
    expect(() => sliceByNumber([1, 2, 3], -1)).toThrow(RangeError);
  });
});