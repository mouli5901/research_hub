import Artifact from '../models/Artifact.js';
import Commit from '../models/Commit.js';
import Branch from '../models/Branch.js';
import Chunk from '../models/Chunk.js';
import { computeSemanticDiff } from '../services/diffService.js';
import { findCommonAncestor, performThreeWayMerge } from '../services/mergeService.js';
import { notifyNewCommit } from '../services/socketService.js';
import { generateEmbedding, cosineSimilarity, indexCommitContent } from '../services/embeddingService.js';
import { answerQuestionFromCorpus } from '../services/ragService.js';

// Helper to get socket io instance attached to app
const getIO = (req) => req.app.get('io');

// POST /api/artifacts
export const createArtifact = async (req, res) => {
  try {
    const { name, type, description, content, message, author, branch } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Artifact name is required.' });
    }

    const branchName = branch || 'main';
    const authorName = author || 'Mouli';

    // 1. Create Artifact
    const artifact = await Artifact.create({
      name,
      type: type || 'markdown',
      description: description || '',
      defaultBranch: branchName
    });

    // 2. Create Initial Commit
    const initialContent = content !== undefined ? content : `# ${name}\n\nInitial research content.`;
    const commit = await Commit.create({
      artifactId: artifact._id,
      content: initialContent,
      parentCommit: null,
      branch: branchName,
      message: message || 'Initial research import',
      author: authorName,
      timestamp: new Date()
    });

    // 3. Create Initial Branch
    const initialBranch = await Branch.create({
      artifactId: artifact._id,
      name: branchName,
      headCommit: commit._id
    });

    // 4. Index content into Chunk collection for vector search
    indexCommitContent(artifact, commit).catch(err => console.error('Error indexing initial commit:', err));

    return res.status(201).json({
      message: 'Artifact created successfully',
      artifact,
      commit,
      branch: initialBranch
    });
  } catch (error) {
    console.error('Error creating artifact:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/artifacts
export const getArtifacts = async (req, res) => {
  try {
    let artifacts = await Artifact.find().sort({ updatedAt: -1 });
    
    // Auto-seed initial research artifact if database is empty
    if (artifacts.length === 0) {
      const artifact = await Artifact.create({
        name: 'DeepSeek_R1_Architectural_Synthesis.md',
        type: 'markdown',
        description: 'Research synthesis on reasoning models and semantic retrieval strategies.',
        defaultBranch: 'main'
      });

      const commit = await Commit.create({
        artifactId: artifact._id,
        content: `# DeepSeek-R1 Architecture & Semantic Retrieval Benchmark\n\n## 1. Abstract\nThis document outlines our research on low-cost reasoning models and semantic retrieval strategies for scientific corpora.\n\n## 2. Research Hypothesis & Problem Statement\nThe system uses keyword-based retrieval.\n\n## 3. Empirical Evaluation & Accuracy Metrics\n- Baseline Accuracy: 74% precision using TF-IDF\n- Experimental Accuracy: The model achieved 82% accuracy.`,
        parentCommit: null,
        branch: 'main',
        message: 'Initial research import',
        author: 'Mouli',
        timestamp: new Date()
      });

      await Branch.create({
        artifactId: artifact._id,
        name: 'main',
        headCommit: commit._id
      });

      artifacts = [artifact];
    }

    return res.json(artifacts);
  } catch (error) {
    console.error('Error fetching artifacts:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/artifacts/:id
export const getArtifactById = async (req, res) => {
  try {
    const artifact = await Artifact.findById(req.params.id);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found.' });
    }

    const branches = await Branch.find({ artifactId: artifact._id }).populate('headCommit');

    return res.json({
      artifact,
      branches
    });
  } catch (error) {
    console.error('Error fetching artifact details:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/artifacts/:id/commits
export const createCommit = async (req, res) => {
  try {
    const { id: artifactId } = req.params;
    const { content, message, branch, author, parentCommit, expectedHeadCommit } = req.body;

    if (!content || !message) {
      return res.status(400).json({ error: 'Commit content and message are required.' });
    }

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found.' });
    }

    const targetBranchName = branch || artifact.defaultBranch || 'main';
    const authorName = author || 'Mouli';

    // Find existing branch to get head commit if parentCommit is not explicitly passed
    let targetBranch = await Branch.findOne({ artifactId, name: targetBranchName }).populate('headCommit');

    // Stale version check: prevent silent overwrites when saving based on outdated commit
    if (expectedHeadCommit && targetBranch && targetBranch.headCommit) {
      const currentHeadId = targetBranch.headCommit._id.toString();
      if (expectedHeadCommit !== currentHeadId) {
        return res.status(409).json({
          error: 'STALE_VERSION_CONFLICT',
          message: 'Your edit is based on an outdated commit version. Newer commits exist on this branch.',
          currentHeadCommit: targetBranch.headCommit,
          expectedCommit: expectedHeadCommit
        });
      }
    }

    let parentCommitId = parentCommit || null;
    if (!parentCommitId && targetBranch && targetBranch.headCommit) {
      parentCommitId = targetBranch.headCommit._id;
    }

    // 1. Create new Commit
    const newCommit = await Commit.create({
      artifactId,
      content,
      parentCommit: parentCommitId,
      branch: targetBranchName,
      message,
      author: authorName,
      timestamp: new Date()
    });

    // 2. Update or create Branch head pointer
    if (targetBranch) {
      targetBranch.headCommit = newCommit._id;
      await targetBranch.save();
    } else {
      targetBranch = await Branch.create({
        artifactId,
        name: targetBranchName,
        headCommit: newCommit._id
      });
    }

    // Index content into Chunk collection for vector search
    indexCommitContent(artifact, newCommit).catch(err => console.error('Error indexing commit:', err));

    // Broadcast Socket.IO commit event
    notifyNewCommit(getIO(req), artifactId, {
      artifactId,
      commit: newCommit,
      branch: targetBranch
    });

    return res.status(201).json({
      message: 'Commit created successfully',
      commit: newCommit,
      branch: targetBranch
    });
  } catch (error) {
    console.error('Error creating commit:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/artifacts/:id/commits
export const getCommits = async (req, res) => {
  try {
    const { id: artifactId } = req.params;
    const { branch } = req.query;

    const filter = { artifactId };
    if (branch) {
      filter.branch = branch;
    }

    const commits = await Commit.find(filter)
      .populate('parentCommit', 'message author timestamp branch')
      .sort({ timestamp: -1 });

    return res.json(commits);
  } catch (error) {
    console.error('Error fetching commits:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/artifacts/:id/changes-since
export const getChangesSince = async (req, res) => {
  try {
    const { id: artifactId } = req.params;
    const { lastSeenCommit, branch } = req.query;

    if (!lastSeenCommit) {
      return res.json({
        artifactId,
        branch: branch || 'main',
        lastSeenCommit: null,
        hasNewChanges: false,
        newCommitsCount: 0,
        newCommits: []
      });
    }

    const lastSeenObj = await Commit.findById(lastSeenCommit);
    if (!lastSeenObj) {
      return res.json({
        artifactId,
        branch: branch || 'main',
        lastSeenCommit,
        hasNewChanges: false,
        newCommitsCount: 0,
        newCommits: []
      });
    }

    const filter = {
      artifactId,
      timestamp: { $gt: lastSeenObj.timestamp }
    };
    if (branch) {
      filter.branch = branch;
    }

    const newCommits = await Commit.find(filter).sort({ timestamp: -1 });

    return res.json({
      artifactId,
      branch: branch || 'main',
      lastSeenCommit,
      hasNewChanges: newCommits.length > 0,
      newCommitsCount: newCommits.length,
      newCommits
    });
  } catch (error) {
    console.error('Error fetching changes since:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/artifacts/search
export const searchArtifacts = async (req, res) => {
  try {
    const { q, type } = req.query;

    if (!q || !q.trim()) {
      return res.json([]);
    }

    const queryStr = q.trim();
    const queryVector = await generateEmbedding(queryStr);

    // If Chunk database is currently empty, perform lazy indexing of existing commits
    const chunkCount = await Chunk.countDocuments();
    if (chunkCount === 0) {
      const allArtifacts = await Artifact.find();
      for (const art of allArtifacts) {
        const latestCommit = await Commit.findOne({ artifactId: art._id }).sort({ timestamp: -1 });
        if (latestCommit) {
          await indexCommitContent(art, latestCommit);
        }
      }
    }

    const filter = {};
    if (type && type !== 'all') {
      filter.artifactType = type.toLowerCase();
    }

    const chunks = await Chunk.find(filter);
    const scoredResults = [];

    const queryWords = queryStr.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    for (const chunk of chunks) {
      const vectorSim = chunk.vector && chunk.vector.length > 0
        ? cosineSimilarity(queryVector, chunk.vector)
        : 0;

      let keywordScore = 0;
      const lowerText = chunk.text.toLowerCase();
      for (const word of queryWords) {
        if (lowerText.includes(word)) {
          keywordScore += 0.25;
        }
      }

      const totalScore = vectorSim * 0.6 + keywordScore * 0.4;

      if (totalScore > 0.05 || lowerText.includes(queryStr.toLowerCase())) {
        let snippet = chunk.text;
        queryWords.forEach(word => {
          const regex = new RegExp(`(${word})`, 'gi');
          snippet = snippet.replace(regex, '<mark>$1</mark>');
        });

        const shortCommitHash = chunk.commitId.toString().substring(chunk.commitId.toString().length - 7);

        scoredResults.push({
          id: chunk._id,
          title: chunk.artifactName,
          type: chunk.artifactType,
          typeBadge: chunk.artifactType === 'chat' ? 'Chat' 
                    : chunk.artifactType === 'pdf' ? 'PDF' 
                    : chunk.artifactType === 'code' ? 'Python' : 'Markdown',
          source: chunk.artifactName,
          branch: chunk.branch || 'main',
          commitHash: shortCommitHash,
          commitId: chunk.commitId,
          artifactId: chunk.artifactId,
          snippet: snippet.length > 300 ? snippet.substring(0, 300) + '...' : snippet,
          score: Math.round(totalScore * 100) / 100
        });
      }
    }

    scoredResults.sort((a, b) => b.score - a.score);

    return res.json(scoredResults.slice(0, 15));
  } catch (error) {
    console.error('Error performing semantic search:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/artifacts/ask-ai
export const askAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Please provide a research question.' });
    }

    // Lazy index chunks if missing
    const chunkCount = await Chunk.countDocuments();
    if (chunkCount === 0) {
      const allArtifacts = await Artifact.find();
      for (const art of allArtifacts) {
        const latestCommit = await Commit.findOne({ artifactId: art._id }).sort({ timestamp: -1 });
        if (latestCommit) {
          await indexCommitContent(art, latestCommit);
        }
      }
    }

    const result = await answerQuestionFromCorpus(question);

    return res.json(result);
  } catch (error) {
    console.error('Error answering question in askAI:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/artifacts/:id/branches
export const createBranch = async (req, res) => {
  try {
    const { id: artifactId } = req.params;
    const { name, fromBranch, headCommit } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found.' });
    }

    const existingBranch = await Branch.findOne({ artifactId, name });
    if (existingBranch) {
      return res.status(400).json({ error: `Branch '${name}' already exists.` });
    }

    let targetHeadCommitId = headCommit || null;
    if (!targetHeadCommitId) {
      const parentBranchName = fromBranch || artifact.defaultBranch || 'main';
      const parentBranch = await Branch.findOne({ artifactId, name: parentBranchName });
      if (parentBranch) {
        targetHeadCommitId = parentBranch.headCommit;
      } else {
        const latestCommit = await Commit.findOne({ artifactId }).sort({ timestamp: -1 });
        if (!latestCommit) {
          return res.status(400).json({ error: 'Cannot branch on artifact with no commits.' });
        }
        targetHeadCommitId = latestCommit._id;
      }
    }

    const newBranch = await Branch.create({
      artifactId,
      name,
      headCommit: targetHeadCommitId
    });

    return res.status(201).json({
      message: `Branch '${name}' created successfully`,
      branch: newBranch
    });
  } catch (error) {
    console.error('Error creating branch:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/artifacts/:id/branches
export const getBranches = async (req, res) => {
  try {
    const { id: artifactId } = req.params;
    const branches = await Branch.find({ artifactId }).populate('headCommit');
    return res.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return res.status(500).json({ error: error.message });
  }
};

// GET /api/artifacts/:id/diff
export const getDiff = async (req, res) => {
  try {
    const { id: artifactId } = req.params;
    const { baseCommit, compareCommit, baseBranch = 'main', compareBranch = 'experiment' } = req.query;

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found.' });
    }

    let baseCommitObj = null;
    let compareCommitObj = null;

    if (baseCommit) {
      baseCommitObj = await Commit.findById(baseCommit);
    } else {
      const bBranch = await Branch.findOne({ artifactId, name: baseBranch }).populate('headCommit');
      baseCommitObj = bBranch ? bBranch.headCommit : null;
    }

    if (compareCommit) {
      compareCommitObj = await Commit.findById(compareCommit);
    } else {
      const cBranch = await Branch.findOne({ artifactId, name: compareBranch }).populate('headCommit');
      compareCommitObj = cBranch ? cBranch.headCommit : null;
    }

    const allCommits = await Commit.find({ artifactId }).sort({ timestamp: -1 });
    if (!baseCommitObj && allCommits.length > 0) {
      baseCommitObj = allCommits[allCommits.length - 1];
    }
    if (!compareCommitObj && allCommits.length > 0) {
      compareCommitObj = allCommits[0];
    }

    const baseText = baseCommitObj ? baseCommitObj.content : '';
    const compareText = compareCommitObj ? compareCommitObj.content : '';

    const diffResult = computeSemanticDiff(baseText, compareText);

    return res.json({
      artifactId: artifact._id,
      fileName: artifact.name,
      baseBranch: baseCommitObj?.branch || baseBranch,
      compareBranch: compareCommitObj?.branch || compareBranch,
      baseCommit: baseCommitObj ? {
        _id: baseCommitObj._id,
        shortHash: baseCommitObj._id.toString().substring(baseCommitObj._id.toString().length - 7),
        message: baseCommitObj.message,
        branch: baseCommitObj.branch
      } : null,
      compareCommit: compareCommitObj ? {
        _id: compareCommitObj._id,
        shortHash: compareCommitObj._id.toString().substring(compareCommitObj._id.toString().length - 7),
        message: compareCommitObj.message,
        branch: compareCommitObj.branch
      } : null,
      summary: diffResult.summary,
      blocks: diffResult.blocks
    });
  } catch (error) {
    console.error('Error calculating semantic diff:', error);
    return res.status(500).json({ error: error.message });
  }
};

// POST /api/artifacts/:id/merge
export const mergeBranches = async (req, res) => {
  try {
    const { id: artifactId } = req.params;
    const { targetBranch = 'main', sourceBranch = 'experiment', resolvedContent, resolutionStrategy, author = 'Mouli' } = req.body;

    const artifact = await Artifact.findById(artifactId);
    if (!artifact) {
      return res.status(404).json({ error: 'Artifact not found.' });
    }

    const tgtBranchObj = await Branch.findOne({ artifactId, name: targetBranch }).populate('headCommit');
    const srcBranchObj = await Branch.findOne({ artifactId, name: sourceBranch }).populate('headCommit');

    if (!tgtBranchObj || !srcBranchObj) {
      return res.status(400).json({ error: 'Target or source branch not found.' });
    }

    const tgtHead = tgtBranchObj.headCommit;
    const srcHead = srcBranchObj.headCommit;

    if (resolvedContent !== undefined && resolvedContent !== null) {
      const mergeCommitMsg = resolutionStrategy 
        ? `Merge branch '${sourceBranch}' into ${targetBranch} (${resolutionStrategy})`
        : `Merge branch '${sourceBranch}' into ${targetBranch}`;

      const newMergeCommit = await Commit.create({
        artifactId,
        content: resolvedContent,
        parentCommit: tgtHead?._id || null,
        branch: targetBranch,
        message: mergeCommitMsg,
        author,
        timestamp: new Date()
      });

      tgtBranchObj.headCommit = newMergeCommit._id;
      await tgtBranchObj.save();

      indexCommitContent(artifact, newMergeCommit).catch(err => console.error('Error indexing merge commit:', err));

      notifyNewCommit(getIO(req), artifactId, {
        artifactId,
        commit: newMergeCommit,
        branch: tgtBranchObj
      });

      return res.json({
        status: 'MERGED',
        message: `Successfully merged '${sourceBranch}' into '${targetBranch}'`,
        commit: newMergeCommit,
        branch: tgtBranchObj
      });
    }

    const commonAncestorCommit = await findCommonAncestor(Commit, tgtHead?._id, srcHead?._id);
    const ancestorContent = commonAncestorCommit ? commonAncestorCommit.content : '';

    const mergeResult = performThreeWayMerge(ancestorContent, tgtHead?.content || '', srcHead?.content || '');

    if (mergeResult.hasConflicts) {
      return res.json({
        status: 'CONFLICT',
        artifactId,
        targetBranch,
        sourceBranch,
        targetCommit: tgtHead ? { _id: tgtHead._id, message: tgtHead.message } : null,
        sourceCommit: srcHead ? { _id: srcHead._id, message: srcHead.message } : null,
        ancestorCommit: commonAncestorCommit ? { _id: commonAncestorCommit._id, message: commonAncestorCommit.message } : null,
        targetContent: tgtHead?.content || '',
        sourceContent: srcHead?.content || '',
        ancestorContent,
        conflicts: mergeResult.conflicts
      });
    }

    const autoCommitMsg = `Merge branch '${sourceBranch}' into ${targetBranch}`;
    const autoMergeCommit = await Commit.create({
      artifactId,
      content: mergeResult.autoMergedContent,
      parentCommit: tgtHead?._id || null,
      branch: targetBranch,
      message: autoCommitMsg,
      author,
      timestamp: new Date()
    });

    tgtBranchObj.headCommit = autoMergeCommit._id;
    await tgtBranchObj.save();

    indexCommitContent(artifact, autoMergeCommit).catch(err => console.error('Error indexing auto-merge commit:', err));

    notifyNewCommit(getIO(req), artifactId, {
      artifactId,
      commit: autoMergeCommit,
      branch: tgtBranchObj
    });

    return res.json({
      status: 'MERGED',
      message: `Clean auto-merge completed for '${sourceBranch}' into '${targetBranch}'`,
      commit: autoMergeCommit,
      branch: tgtBranchObj
    });
  } catch (error) {
    console.error('Error merging branches:', error);
    return res.status(500).json({ error: error.message });
  }
};
