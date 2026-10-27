import { describe, it, expect } from 'vitest';
import { computeSemanticDiff } from './diffService';

describe('diffService', () => {
  it('should correctly calculate additions, deletions, modifications, and unchanged lines', () => {
    const baseText = "Line one.\nLine two is the same.\nLine three is different.\nLine four goes away.";
    const compareText = "Line one added stuff.\nLine two is the same.\nLine three is somewhat different.\nLine five is brand new.";

    const result = computeSemanticDiff(baseText, compareText);

    expect(result.summary.additions).toBeGreaterThanOrEqual(1);
    expect(result.summary.deletions).toBeGreaterThanOrEqual(1);

    // We expect "Line two is the same." to be unchanged.
    const unchanged = result.blocks.filter(b => b.type === 'unchanged');
    expect(unchanged.length).toBe(1);
    expect(unchanged[0].content).toBe('Line two is the same.');

    // Modified lines depend on the exact Jaccard similarity implementation,
    // but at least one of the lines should trigger a modification or an add/remove pair.
    // "Line three is different." -> "Line three is somewhat different." (high overlap)
    const modified = result.blocks.filter(b => b.type === 'modified');
    expect(modified.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle identical texts correctly', () => {
    const text = "This is a test.\nOnly a test.";
    const result = computeSemanticDiff(text, text);

    expect(result.summary.additions).toBe(0);
    expect(result.summary.deletions).toBe(0);
    expect(result.summary.modifications).toBe(0);
    expect(result.blocks.every(b => b.type === 'unchanged')).toBe(true);
  });

  it('should handle completely different texts', () => {
    const baseText = "Apples and oranges.";
    const compareText = "Dogs and cats.";
    const result = computeSemanticDiff(baseText, compareText);

    expect(result.summary.similarityScore).toBeLessThan(50);
  });
});
