export const MOCK_BRANCHES = [
  { id: 'main', name: 'main', description: 'Production research baseline', isDefault: true },
  { id: 'experiment', name: 'experiment', description: 'Dense vs Sparse vector search evaluations', isDefault: false },
  { id: 'literature-review', name: 'literature-review', description: 'ChatGPT & Claude paper synthesis', isDefault: false }
];

export const MOCK_USERS = [
  { id: 'u1', name: 'Mouli', role: 'Lead Researcher', status: 'editing', isCurrentUser: true, avatarBg: '#3b82f6' },
  { id: 'u2', name: 'Dr. Aris', role: 'Principal Investigator', status: 'viewing', isCurrentUser: false, avatarBg: '#10b981' },
  { id: 'u3', name: 'Sarah Chen', role: 'AI Systems Engineer', status: 'reviewing diff', isCurrentUser: false, avatarBg: '#a855f7' }
];

export const MOCK_ARTIFACTS = [
  {
    id: 'art-1',
    name: 'DeepSeek_R1_Architectural_Synthesis.md',
    type: 'Markdown / Document',
    iconType: 'document',
    branch: 'main',
    version: 'c7f9a2e',
    lastModified: '12 minutes ago',
    author: 'Mouli',
    size: '14.2 KB',
    content: `# DeepSeek-R1 Architecture & Semantic Retrieval Benchmark

## 1. Abstract
This document outlines our research on low-cost reasoning models and semantic retrieval strategies for scientific corpora. By comparing keyword-based indexing against dense vector representations, we evaluate precision, recall, and computational latency.

## 2. Research Hypothesis & Problem Statement
Traditional academic search tools rely on BM25 keyword matching, which fails when querying implicit concepts or cross-disciplinary terminology.

The system uses semantic vector-based retrieval with high-dimensional embedding spaces (1536-dim) and HNSW index graphs to enable conceptual retrieval.

## 3. Experimental Methodology & Setup
- **Embedding Model**: Text-Embedding-3-Large & BGE-M3
- **Vector Storage**: HNSW-indexed vector collection with cosine similarity metric
- **Benchmark Corpus**: 12,500 arXiv preprints & 4,200 ChatGPT research logs
- **Hardware**: 1x NVIDIA A100 (80GB VRAM)

## 4. Empirical Evaluation & Accuracy Metrics
- **Baseline Accuracy**: 82% precision@5 using hybrid keyword retrieval
- **Experimental Accuracy**: The model achieved 91% accuracy using dense semantic retrieval with re-ranking
- **Latency**: Mean query response time: 42ms (vector) vs 110ms (hybrid)

## 5. Conclusions & Next Steps
Dense vector-based semantic retrieval significantly outperforms keyword matching in recall for research synthesis. Future work includes testing multi-vector ColBERT architecture on domain-specific PDFs.`
  },
  {
    id: 'art-2',
    name: 'ChatGPT_Claude_RAG_Discussion.json',
    type: 'ChatGPT / Claude Export',
    iconType: 'chat',
    branch: 'literature-review',
    version: '890abcd',
    lastModified: '5 minutes ago',
    author: 'Sarah Chen',
    size: '48.6 KB',
    content: `[
  {
    "sender": "User",
    "timestamp": "2026-08-22T18:14:02Z",
    "text": "How does hierarchical chunking compare to fixed-size overlapping chunks for scientific paper retrieval?"
  },
  {
    "sender": "Claude 3.5 Sonnet",
    "timestamp": "2026-08-22T18:14:15Z",
    "text": "Hierarchical chunking preserves paper structure (Abstract -> Section -> Paragraph) allowing small chunks for precision matching while retrieving parent sections for full LLM context..."
  },
  {
    "sender": "User",
    "timestamp": "2026-08-22T18:30:20Z",
    "text": "Can we version chat history alongside paper drafts to preserve research prompt provenance?"
  },
  {
    "sender": "ChatGPT (GPT-4o)",
    "timestamp": "2026-08-22T18:30:45Z",
    "text": "Yes! Treat prompt logs as immutable append-only commits tied to paper revisions. This ensures complete reproducibility."
  }
]`
  },
  {
    id: 'art-3',
    name: 'Attention_Is_All_You_Need_Annotated.pdf',
    type: 'PDF Document',
    iconType: 'pdf',
    branch: 'main',
    version: 'a1b2c3d',
    lastModified: '2 hours ago',
    author: 'Dr. Aris',
    size: '2.4 MB',
    content: `PDF DOCUMENT PREVIEW: Attention Is All You Need (Vaswani et al.)
[Annotated by ResearchHub System - 14 annotations, 3 vector highlights]

Page 1: Abstract & Multi-Head Self-Attention formulation.
Page 3: Positional Encoding calculations: PE(pos, 2i) = sin(pos/10000^(2i/d_model))
Page 5: Scaled Dot-Product Attention: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) V`
  },
  {
    id: 'art-4',
    name: 'vector_embeddings_pipeline.py',
    type: 'Codebase / Script',
    iconType: 'code',
    branch: 'experiment',
    version: 'e4f5g6h',
    lastModified: '45 minutes ago',
    author: 'Mouli',
    size: '5.1 KB',
    content: `import numpy as np
import torch
from typing import List, Dict

class ResearchVectorPipeline:
    def __init__(self, model_name: str = "text-embedding-3-large"):
        self.model_name = model_name
        self.dimension = 1536
        
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate normalized dense embeddings for research text chunks."""
        print(f"Embedding {len(texts)} research sections using {self.model_name}")
        # Vector generation simulation
        embeddings = np.random.randn(len(texts), self.dimension)
        norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings / norms

    def calculate_semantic_diff(self, doc_v1: str, doc_v2: str) -> Dict:
        """Compute semantic similarity distance between document commits."""
        return {"cosine_similarity": 0.942, "status": "SEMANTIC_MUTATION_DETECTED"}
`
  }
];

export const MOCK_COMMITS = [
  {
    id: 'c7f9a2e',
    hash: 'c7f9a2e',
    shortHash: 'c7f9a2e',
    message: 'Updated retrieval results with 91% accuracy metric',
    author: 'Mouli',
    time: '12 minutes ago',
    branch: 'main',
    artifactName: 'DeepSeek_R1_Architectural_Synthesis.md',
    changes: '+14 lines, -3 lines'
  },
  {
    id: 'e4f5g6h',
    hash: 'e4f5g6h',
    shortHash: 'e4f5g6h',
    message: 'Added methodology section & python vector embedding pipeline script',
    author: 'Mouli',
    time: '45 minutes ago',
    branch: 'experiment',
    artifactName: 'vector_embeddings_pipeline.py',
    changes: '+42 lines, -0 lines'
  },
  {
    id: 'a1b2c3d',
    hash: 'a1b2c3d',
    shortHash: 'a1b2c3d',
    message: 'Initial research import: Transformer paper PDF & benchmark draft',
    author: 'Dr. Aris',
    time: '2 hours ago',
    branch: 'main',
    artifactName: 'Attention_Is_All_You_Need_Annotated.pdf',
    changes: '+128 lines, -0 lines'
  },
  {
    id: '890abcd',
    hash: '890abcd',
    shortHash: '890abcd',
    message: 'Synthesized multi-head RAG chat logs from Claude export',
    author: 'Sarah Chen',
    time: '5 minutes ago',
    branch: 'literature-review',
    artifactName: 'ChatGPT_Claude_RAG_Discussion.json',
    changes: '+29 lines, -0 lines'
  }
];

export const MOCK_DIFF_DATA = {
  fileName: 'DeepSeek_R1_Architectural_Synthesis.md',
  baseBranch: 'main',
  compareBranch: 'experiment',
  baseCommit: 'a1b2c3d',
  compareCommit: 'c7f9a2e',
  summary: {
    additions: 12,
    deletions: 4,
    modifications: 3,
    semanticSimilarity: '94.2% match (High Semantic Overlap)'
  },
  blocks: [
    {
      type: 'unchanged',
      lineNumberBase: 10,
      lineNumberCompare: 10,
      content: 'Traditional academic search tools rely on BM25 keyword matching, which fails when querying implicit concepts.'
    },
    {
      type: 'removed',
      lineNumberBase: 11,
      lineNumberCompare: null,
      content: 'The system uses keyword-based retrieval.'
    },
    {
      type: 'added',
      lineNumberBase: null,
      lineNumberCompare: 11,
      content: 'The system uses semantic vector-based retrieval with high-dimensional embedding spaces (1536-dim).'
    },
    {
      type: 'unchanged',
      lineNumberBase: 12,
      lineNumberCompare: 12,
      content: '## 3. Experimental Methodology & Setup'
    },
    {
      type: 'removed',
      lineNumberBase: 18,
      lineNumberCompare: null,
      content: '- Baseline Accuracy: 74% precision using TF-IDF'
    },
    {
      type: 'added',
      lineNumberBase: null,
      lineNumberCompare: 18,
      content: '- Baseline Accuracy: 82% precision@5 using hybrid keyword retrieval'
    },
    {
      type: 'removed',
      lineNumberBase: 19,
      lineNumberCompare: null,
      content: '- Experimental Accuracy: The model achieved 82% accuracy.'
    },
    {
      type: 'added',
      lineNumberBase: null,
      lineNumberCompare: 19,
      content: '- Experimental Accuracy: The model achieved 91% accuracy using dense semantic retrieval with re-ranking.'
    }
  ]
};

export const MOCK_CONFLICT_DATA = {
  artifactName: 'DeepSeek_R1_Architectural_Synthesis.md',
  sourceBranch: 'experiment',
  targetBranch: 'main',
  conflictSection: 'Section 4: Evaluation Accuracy',
  mainContent: 'The model achieved 82% accuracy using hybrid BM25 + dense retrieval.',
  experimentContent: 'The model achieved 91% accuracy using dense vector-based semantic retrieval with re-ranking.',
  lineNumber: 19,
  status: 'PENDING' // 'PENDING' | 'RESOLVED_MAIN' | 'RESOLVED_EXPERIMENT' | 'RESOLVED_MANUAL'
};

export const MOCK_SEARCH_RESULTS = [
  {
    id: 'sr-1',
    title: 'DeepSeek R1 Architecture & Semantic Retrieval Benchmark',
    type: 'Document',
    typeBadge: 'Markdown',
    source: 'DeepSeek_R1_Architectural_Synthesis.md',
    branch: 'main',
    snippet: '...The system uses <mark>semantic vector-based retrieval</mark> with high-dimensional embedding spaces (1536-dim) to achieve <mark>91% accuracy</mark>...',
    commitHash: 'c7f9a2e'
  },
  {
    id: 'sr-2',
    title: 'Hierarchical chunking vs overlapping chunks in RAG',
    type: 'ChatGPT / Claude Export',
    typeBadge: 'Chat',
    source: 'ChatGPT_Claude_RAG_Discussion.json',
    branch: 'literature-review',
    snippet: '...Hierarchical chunking preserves paper structure allowing <mark>retrieval augmented generation</mark> to query context precisely...',
    commitHash: '890abcd'
  },
  {
    id: 'sr-3',
    title: 'Attention Is All You Need Annotated PDF',
    type: 'PDF Paper',
    typeBadge: 'PDF',
    source: 'Attention_Is_All_You_Need_Annotated.pdf',
    branch: 'main',
    snippet: '...Scaled Dot-Product Attention equation and multi-head representation for <mark>semantic indexing</mark>...',
    commitHash: 'a1b2c3d'
  },
  {
    id: 'sr-4',
    title: 'ResearchVectorPipeline.calculate_semantic_diff()',
    type: 'Codebase',
    typeBadge: 'Python',
    source: 'vector_embeddings_pipeline.py',
    branch: 'experiment',
    snippet: '...def calculate_semantic_diff(self, doc_v1, doc_v2): compute <mark>vector cosine distance</mark> between document commits...',
    commitHash: 'e4f5g6h'
  }
];
