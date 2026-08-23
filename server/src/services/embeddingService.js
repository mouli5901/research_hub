import Chunk from '../models/Chunk.js';

/**
 * Divide document content into readable research chunks (paragraphs/sections).
 */
export function chunkText(text, maxChunkLength = 400, overlap = 50) {
  if (!text) return [];

  // Split by double newlines to respect paragraph/section boundaries
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const chunks = [];

  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      
      // If a single paragraph is larger than maxChunkLength, split by sentences or chunks
      if (para.length > maxChunkLength) {
        let start = 0;
        while (start < para.length) {
          const end = Math.min(start + maxChunkLength, para.length);
          chunks.push(para.substring(start, end));
          start += (maxChunkLength - overlap);
        }
        currentChunk = '';
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.length > 0 ? chunks : [text];
}

/**
 * Computes a normalized feature embedding vector.
 * Supports OpenAI API if OPENAI_API_KEY is defined in environment variables,
 * otherwise uses a unit-normalized 128-dimensional term-frequency feature vector.
 */
export async function generateEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data[0] && data.data[0].embedding) {
          return data.data[0].embedding;
        }
      }
    } catch (e) {
      console.warn('OpenAI embedding API call failed, using normalized feature vector fallback:', e.message);
    }
  }

  // Fallback: 128-dimensional term-frequency normalized vector
  return generateDeterministicVector(text, 128);
}

function generateDeterministicVector(text, dimension = 128) {
  const vec = new Array(dimension).fill(0);
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);

  if (words.length === 0) return vec;

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % dimension;
    vec[index] += 1;
  }

  // Unit normalize vector (||v|| = 1)
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return norm === 0 ? vec : vec.map(val => val / norm);
}

/**
 * Cosine similarity between two numerical vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  
  const minLen = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < minLen; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Index document commit content into Chunk database entries.
 */
export async function indexCommitContent(artifact, commit) {
  if (!artifact || !commit || !commit.content) return;

  // Remove existing chunks for this commit to keep idempotent
  await Chunk.deleteMany({ commitId: commit._id });

  const textChunks = chunkText(commit.content);

  const chunkDocs = [];
  for (let i = 0; i < textChunks.length; i++) {
    const chunkTextStr = textChunks[i];
    const vector = await generateEmbedding(chunkTextStr);

    chunkDocs.push({
      artifactId: artifact._id,
      commitId: commit._id,
      artifactName: artifact.name,
      artifactType: artifact.type || 'markdown',
      branch: commit.branch || 'main',
      chunkIndex: i,
      text: chunkTextStr,
      vector
    });
  }

  if (chunkDocs.length > 0) {
    await Chunk.insertMany(chunkDocs);
  }
}
