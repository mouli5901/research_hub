import multer from 'multer';
import Artifact from '../models/Artifact.js';
import Commit from '../models/Commit.js';
import Branch from '../models/Branch.js';
import { parseArtifactContent } from '../services/ingestionService.js';
import { indexCommitContent } from '../services/embeddingService.js';

// Configure Multer for in-memory file storage
const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB max file size limit
}).single('file');

export const ingestArtifact = async (req, res) => {
  try {
    const file = req.file;
    const { name, type, content, branch, author } = req.body;

    const artifactName = name || file?.originalname || 'Ingested_Research_Document.md';
    const artifactType = type || 'markdown';
    const targetBranch = branch || 'main';
    const authorName = author || 'Mouli';

    let fileBuffer = file ? file.buffer : null;
    let mimeType = file ? file.mimetype : 'text/plain';
    let originalName = file ? file.originalname : artifactName;

    if (!fileBuffer && (!content || content.trim().length === 0)) {
      return res.status(400).json({ error: 'Please upload a file or provide text content for ingestion.' });
    }

    if (!fileBuffer && content) {
      fileBuffer = Buffer.from(content, 'utf-8');
    }

    // 1. Parse and normalize content
    const parsed = await parseArtifactContent(fileBuffer, mimeType, originalName, artifactType);

    // 2. Create Artifact Model
    const artifact = await Artifact.create({
      name: artifactName,
      type: parsed.detectedType || artifactType,
      defaultBranch: targetBranch,
      description: `Ingested from ${file ? 'uploaded file (' + originalName + ')' : 'pasted text'}`
    });

    // 3. Create Initial Commit
    const commit = await Commit.create({
      artifactId: artifact._id,
      content: parsed.normalizedContent,
      parentCommit: null,
      branch: targetBranch,
      message: `Ingested artifact ${artifactName}`,
      author: authorName,
      timestamp: new Date()
    });

    // 4. Create Initial Branch
    const initialBranch = await Branch.create({
      artifactId: artifact._id,
      name: targetBranch,
      headCommit: commit._id
    });

    // 5. Index chunks into vector search collection
    indexCommitContent(artifact, commit).catch(err => console.error('Error indexing ingested commit:', err));

    return res.status(201).json({
      message: 'Artifact ingested successfully',
      artifact,
      commit,
      branch: initialBranch
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return res.status(400).json({ error: error.message || 'Failed to ingest research artifact.' });
  }
};
