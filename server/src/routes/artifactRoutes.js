import express from 'express';
import {
  createArtifact,
  getArtifacts,
  getArtifactById,
  createCommit,
  getCommits,
  createBranch,
  getBranches,
  getDiff,
  mergeBranches,
  getChangesSince,
  searchArtifacts,
  askAI
} from '../controllers/artifactController.js';
import { ingestArtifact, uploadMiddleware } from '../controllers/ingestController.js';

const router = express.Router();

// 1. Static Endpoint Routes (MUST come BEFORE /:id to prevent CastError)
router.get('/search', searchArtifacts);
router.post('/ask-ai', askAI);
router.post('/ingest', uploadMiddleware, ingestArtifact);

// 2. Collection Root Routes
router.post('/', createArtifact);
router.get('/', getArtifacts);

// 3. Parametrized Sub-resource Routes (MUST come AFTER static routes)
router.get('/:id/changes-since', getChangesSince);
router.get('/:id/diff', getDiff);
router.post('/:id/merge', mergeBranches);
router.post('/:id/commits', createCommit);
router.get('/:id/commits', getCommits);
router.post('/:id/branches', createBranch);
router.get('/:id/branches', getBranches);

// 4. Parametrized Single Artifact Route
router.get('/:id', getArtifactById);

export default router;
