/**
 * Lightweight, deterministic paragraph/sentence-level semantic diff service.
 * No LLM or embeddings required. Uses Jaccard word token overlap and sequence alignment.
 */

function tokenize(text) {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)
  );
}

function calculateJaccardSimilarity(text1, text2) {
  const set1 = tokenize(text1);
  const set2 = tokenize(text2);
  
  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const word of set1) {
    if (set2.has(word)) {
      intersectionCount++;
    }
  }

  const unionSize = new Set([...set1, ...set2]).size;
  return unionSize === 0 ? 0.0 : intersectionCount / unionSize;
}

export function computeSemanticDiff(baseText = '', compareText = '') {
  const baseLines = baseText.split('\n');
  const compareLines = compareText.split('\n');

  const blocks = [];
  let additions = 0;
  let deletions = 0;
  let modifications = 0;

  let i = 0; // base pointer
  let j = 0; // compare pointer

  while (i < baseLines.length || j < compareLines.length) {
    const lineBase = baseLines[i];
    const lineCompare = compareLines[j];

    // If both reached end
    if (i >= baseLines.length) {
      blocks.push({
        type: 'added',
        lineNumberBase: null,
        lineNumberCompare: j + 1,
        content: lineCompare
      });
      additions++;
      j++;
      continue;
    }

    if (j >= compareLines.length) {
      blocks.push({
        type: 'removed',
        lineNumberBase: i + 1,
        lineNumberCompare: null,
        content: lineBase
      });
      deletions++;
      i++;
      continue;
    }

    // Exact match
    if (lineBase === lineCompare) {
      blocks.push({
        type: 'unchanged',
        lineNumberBase: i + 1,
        lineNumberCompare: j + 1,
        content: lineBase
      });
      i++;
      j++;
      continue;
    }

    // High similarity match (Modified paragraph/sentence)
    const sim = calculateJaccardSimilarity(lineBase, lineCompare);

    if (sim >= 0.4) {
      blocks.push({
        type: 'modified',
        lineNumberBase: i + 1,
        lineNumberCompare: j + 1,
        baseContent: lineBase,
        compareContent: lineCompare,
        content: lineCompare,
        similarity: Math.round(sim * 100)
      });
      modifications++;
      i++;
      j++;
      continue;
    }

    // Look ahead to check if lineBase was removed or lineCompare was added
    let foundMatchBase = -1;
    for (let k = j + 1; k < Math.min(j + 5, compareLines.length); k++) {
      if (lineBase === compareLines[k]) {
        foundMatchBase = k;
        break;
      }
    }

    let foundMatchCompare = -1;
    for (let k = i + 1; k < Math.min(i + 5, baseLines.length); k++) {
      if (lineCompare === baseLines[k]) {
        foundMatchCompare = k;
        break;
      }
    }

    if (foundMatchBase !== -1) {
      // Compare line at j was added
      blocks.push({
        type: 'added',
        lineNumberBase: null,
        lineNumberCompare: j + 1,
        content: lineCompare
      });
      additions++;
      j++;
    } else if (foundMatchCompare !== -1) {
      // Base line at i was removed
      blocks.push({
        type: 'removed',
        lineNumberBase: i + 1,
        lineNumberCompare: null,
        content: lineBase
      });
      deletions++;
      i++;
    } else {
      // Pair as modified or separate removed/added
      blocks.push({
        type: 'removed',
        lineNumberBase: i + 1,
        lineNumberCompare: null,
        content: lineBase
      });
      deletions++;

      blocks.push({
        type: 'added',
        lineNumberBase: null,
        lineNumberCompare: j + 1,
        content: lineCompare
      });
      additions++;

      i++;
      j++;
    }
  }

  // Calculate overall document similarity score
  const overallSim = Math.round(calculateJaccardSimilarity(baseText, compareText) * 100);
  let similarityText = `${overallSim}% Match`;
  if (overallSim >= 85) similarityText += ' (High Semantic Overlap)';
  else if (overallSim >= 50) similarityText += ' (Moderate Semantic Overlap)';
  else similarityText += ' (Significant Divergence)';

  return {
    summary: {
      additions,
      deletions,
      modifications,
      similarityScore: overallSim,
      similaritySimilarity: similarityText
    },
    blocks
  };
}
