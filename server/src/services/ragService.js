import Chunk from '../models/Chunk.js';
import { generateEmbedding, cosineSimilarity } from './embeddingService.js';

/**
 * Retrieves top relevant context chunks for a question.
 */
export async function retrieveContextChunks(question, topK = 5) {
  if (!question || !question.trim()) return [];

  const queryVector = await generateEmbedding(question);
  const chunks = await Chunk.find();

  const queryWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = [];
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

    if (totalScore > 0.02 || lowerText.includes(question.toLowerCase())) {
      const shortCommitHash = chunk.commitId.toString().substring(chunk.commitId.toString().length - 7);
      scored.push({
        id: chunk._id,
        artifactId: chunk.artifactId,
        commitId: chunk.commitId,
        commitHash: shortCommitHash,
        artifactName: chunk.artifactName,
        artifactType: chunk.artifactType,
        branch: chunk.branch,
        text: chunk.text,
        score: Math.round(totalScore * 100) / 100
      });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Synthesizes RAG response using LLM or deterministic context synthesis.
 */
export async function answerQuestionFromCorpus(question) {
  const chunks = await retrieveContextChunks(question, 5);

  if (!chunks || chunks.length === 0) {
    return {
      answer: "Based on the available research history, there is insufficient context in the corpus to answer this question.",
      provenance: []
    };
  }

  const contextText = chunks
    .map((c, idx) => `[Chunk ${idx + 1} | Source: ${c.artifactName} | Commit: ${c.commitHash} | Branch: ${c.branch}]\n${c.text}`)
    .join('\n\n');

  const geminiKey = process.env.GEMINI_API_KEY;
  const openAIKey = process.env.OPENAI_API_KEY;

  let answerText = '';

  // 1. Try Gemini API if key is present
  if (geminiKey) {
    try {
      const model = process.env.LLM_MODEL || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `System: You are ResearchHub AI. Answer the question strictly using ONLY the provided research context. If the context does not contain enough information, state: "Based on the available research history, there is insufficient context to answer this question." Do not invent facts.\n\n` +
                  `CONTEXT:\n${contextText}\n\n` +
                  `QUESTION: ${question}`
          }]
        }]
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          answerText = text.trim();
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back:', err.message);
    }
  }

  // 2. Try OpenAI API if key is present and Gemini wasn't used
  if (!answerText && openAIKey) {
    try {
      const model = process.env.LLM_MODEL || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are ResearchHub AI. Answer the question strictly using ONLY the provided research context. If the context does not contain enough information, state: "Based on the available research history, there is insufficient context to answer this question."'
            },
            {
              role: 'user',
              content: `CONTEXT:\n${contextText}\n\nQUESTION: ${question}`
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          answerText = text.trim();
        }
      }
    } catch (err) {
      console.warn('OpenAI API call failed, falling back:', err.message);
    }
  }

  // 3. Fallback: Context-based RAG synthesis
  if (!answerText) {
    const topChunk = chunks[0];
    answerText = `Based on research commit **${topChunk.commitHash}** (*${topChunk.artifactName}*) on branch **${topChunk.branch}**:\n\n${topChunk.text}`;
  }

  const provenance = chunks.map(c => ({
    artifactId: c.artifactId,
    artifactName: c.artifactName,
    artifactType: c.artifactType,
    branch: c.branch,
    commitId: c.commitId,
    commitHash: c.commitHash,
    snippet: c.text.length > 200 ? c.text.substring(0, 200) + '...' : c.text,
    score: c.score
  }));

  return {
    answer: answerText,
    provenance
  };
}
