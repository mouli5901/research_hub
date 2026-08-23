/**
 * 3-Way Merge & Conflict Detection Service
 */

// Traverses parentCommit chain to find the Least Common Ancestor (LCA)
export async function findCommonAncestor(CommitModel, commitId1, commitId2) {
  if (!commitId1 || !commitId2) return null;
  if (commitId1.toString() === commitId2.toString()) {
    return await CommitModel.findById(commitId1);
  }

  const ancestors1 = new Set();
  let curr1 = commitId1;
  while (curr1) {
    ancestors1.add(curr1.toString());
    const c = await CommitModel.findById(curr1);
    curr1 = c?.parentCommit || null;
  }

  let curr2 = commitId2;
  while (curr2) {
    if (ancestors1.has(curr2.toString())) {
      return await CommitModel.findById(curr2);
    }
    const c = await CommitModel.findById(curr2);
    curr2 = c?.parentCommit || null;
  }

  return null;
}

export function performThreeWayMerge(ancestorText = '', targetText = '', sourceText = '') {
  const ancLines = ancestorText.split('\n');
  const tgtLines = targetText.split('\n');
  const srcLines = sourceText.split('\n');

  const maxLines = Math.max(ancLines.length, tgtLines.length, srcLines.length);

  const mergedLines = [];
  const conflicts = [];

  for (let i = 0; i < maxLines; i++) {
    const anc = ancLines[i] !== undefined ? ancLines[i] : '';
    const tgt = tgtLines[i] !== undefined ? tgtLines[i] : '';
    const src = srcLines[i] !== undefined ? srcLines[i] : '';

    // 1. Both identical
    if (tgt === src) {
      mergedLines.push(tgt);
      continue;
    }

    // 2. Only source changed
    if (tgt === anc && src !== anc) {
      mergedLines.push(src);
      continue;
    }

    // 3. Only target changed
    if (src === anc && tgt !== anc) {
      mergedLines.push(tgt);
      continue;
    }

    // 4. Conflict: Both changed differently
    conflicts.push({
      lineNumber: i + 1,
      ancestorContent: anc,
      targetContent: tgt,
      sourceContent: src
    });

    mergedLines.push(`<<<<<<< TARGET (main)\n${tgt}\n=======\n${src}\n>>>>>>> SOURCE (branch)`);
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    autoMergedContent: mergedLines.join('\n')
  };
}
