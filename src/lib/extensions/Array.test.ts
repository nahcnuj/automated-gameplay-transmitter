import { describe, expect, test } from 'bun:test';
import { sliceByNumber } from './Array';

describe('sliceByNumber', () => {
  test('returns empty array for empty input', () => {
    expect([][sliceByNumber](3)).toEqual([]);
  });

  test('splits array into chunks of given size with remainder', () => {
    const actual = [1, 2, 3, 4, 5][sliceByNumber](2);
    expect(actual).toEqual([[1, 2], [3, 4], [5]]);
  });

  test('returns single chunk when n >= length', () => {
    expect([1, 2, 3][sliceByNumber](3)).toEqual([[1, 2, 3]]);
    expect([1, 2, 3][sliceByNumber](10)).toEqual([[1, 2, 3]]);
  });

  test('returns each element in its own array when n = 1', () => {
    expect([1, 2, 3][sliceByNumber](1)).toEqual([[1], [2], [3]]);
  });

  test('does not mutate the original array', () => {
    const input = [1, 2, 3];
    const copy = [...input];
    input[sliceByNumber](2);
    expect(input).toEqual(copy);
  });

  test('throws for non-positive n', () => {
    expect(() => [1, 2, 3][sliceByNumber](0)).toThrow(RangeError);
    expect(() => [1, 2, 3][sliceByNumber](-1)).toThrow(RangeError);
  });
});