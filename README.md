# ResearchHub — Git for Research

A version-control and collaboration platform built for research artifacts — documents, LLM chat exports, and PDFs — with semantic diffing, branching/merge, live presence, and AI-powered retrieval.

> **Hackathon Submission** — Screen Out 2026

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   React (Vite)                      │
│  Sidebar │ WorkspaceHeader │ Editor │ VersionHistory│
│  DiffViewer │ MergeConflict │ ImportModal │ AskAI   │
│  SearchResults │ Presence │ BranchSelector          │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP + Socket.IO
┌──────────────────────▼──────────────────────────────┐
│              Express.js API Server                  │
│  ┌──────────┐ ┌────────────┐ ┌──────────────────┐   │
│  │Ingestion │ │ Versioning │ │  Retrieval/RAG   │   │
│  │ Service  │ │  Engine    │ │    Service       │   │
│  └──────────┘ └────────────┘ └──────────────────┘   │
│  ┌──────────┐ ┌────────────┐ ┌──────────────────┐   │
│  │  Merge   │ │  Socket.IO │ │   Embedding      │   │
│  │ Service  │ │  Presence  │ │    Service       │   │
│  └──────────┘ └────────────┘ └──────────────────┘   │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │     MongoDB Atlas         │
         │  Artifacts │ Commits      │
         │  Branches  │ Chunks       │
         └───────────────────────────┘
```

**Stack:** React 18 + Vite · Express.js · MongoDB (Mongoose) · Socket.IO · OpenAI Embeddings (configurable)

---

## Four Core Pillars

### A. Ingestion Layer

| Feature | Status |
|---------|--------|
| Markdown / plaintext file upload | ✅ |
| ChatGPT JSON export parsing | ✅ |
| Claude JSON/MD export parsing | ✅ |
| Text-extractable PDF ingestion | ✅ |
| Paste raw content directly | ✅ |
| Auto-create Artifact + initial Commit + Branch | ✅ |
| Auto-chunk & embed on ingest | ✅ |

**Backend:** `server/src/services/ingestionService.js` — normalizes each format into clean markdown.  
**API:** `POST /api/artifacts/ingest` (multipart file or JSON body).  
**Frontend:** `ImportModal.jsx` — type selector cards, drag-and-drop file upload, paste fallback.

### B. Versioning Engine

| Feature | Status |
|---------|--------|
| Commit DAG with parent pointers | ✅ |
| Semantic sentence-level diff | ✅ |
| Branch create / switch | ✅ |
| 3-way merge with common ancestor detection | ✅ |
| Conflict detection (both sides modify same sentence) | ✅ |
| Conflict resolution (Keep Main / Keep Source / Manual) | ✅ |
| Stale-version protection (HTTP 409) | ✅ |

**Diff:** `GET /api/artifacts/:id/diff` — sentence tokenization, Levenshtein similarity scoring, structured blocks (added/removed/modified/unchanged).  
**Merge:** `server/src/services/mergeService.js` — walks `parentCommit` chain to find LCA, performs 3-way sentence merge.  
**Frontend:** `DiffViewer.jsx` (green/red code rows), `MergeConflict.jsx` (PR-style mergeability box).

### C. Concurrent Context Layer

| Feature | Status |
|---------|--------|
| Socket.IO live presence (who is viewing/editing) | ✅ |
| Mock user identities (no auth) | ✅ |
| "Changes since I last looked" indicator banner | ✅ |
| Stale-version conflict alert (prevent silent clobber) | ✅ |
| Pull Latest Commit button | ✅ |

**Socket:** `server/src/services/socketService.js` — rooms per `artifact:<id>`, broadcasts presence updates.  
**API:** `GET /api/artifacts/:id/changes-since?lastSeenCommit=...&branch=...`  
**Frontend:** `Presence.jsx` (avatar dots), Workspace banners for new changes and stale conflicts.

### D. Retrieval / Query Surface

| Feature | Status |
|---------|--------|
| Chunk documents into ~400-char segments | ✅ |
| Generate embeddings (OpenAI or 128-dim fallback) | ✅ |
| Hybrid vector + keyword search | ✅ |
| Cross-artifact-type search results | ✅ |
| Ask AI with version-aware RAG | ✅ |
| Provenance citations (artifact name, type, commit hash) | ✅ |

**Embedding:** `server/src/services/embeddingService.js` — configurable via `OPENAI_API_KEY` env var, falls back to deterministic 128-dim normalized vectors.  
**Search:** `GET /api/artifacts/search?q=...&type=...`  
**Ask AI:** `POST /api/artifacts/ask-ai` → retrieves context chunks → sends to LLM → returns grounded answer + provenance.  
**Frontend:** `SearchResults.jsx` (command-palette modal), `AskAIModal.jsx` (Copilot-style Q&A with citations).

---

## What Was Completed vs. Not

### ✅ Completed
- All 4 core pillars fully implemented end-to-end
- GitHub Primer dark theme UI across all components
- 14/14 automated E2E audit tests passing
- Sentence-level semantic diff (deterministic, no LLM)
- 3-way merge with real conflict detection
- Socket.IO real-time presence
- Stale-version protection (HTTP 409 on outdated commits)
- RAG-based Ask AI with provenance citations
- Markdown, ChatGPT, Claude, and PDF ingestion

### ⚠️ Limitations / Not Implemented
- No real authentication (mock users only)
- No OCR for image-based PDFs
- No CRDT / real-time collaborative editing
- No codebase ingestion (stretch goal)
- MongoDB Atlas Vector Search not configured (uses fallback cosine similarity)
- No WebSocket-based live cursor tracking

---

## Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas connection string (or local MongoDB)

### Environment Variables

Create `server/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/git-for-research
PORT=5000
OPENAI_API_KEY=sk-...          # Optional: for real embeddings & Ask AI
OPENAI_MODEL=gpt-4o-mini       # Optional: LLM model for RAG
```

### Install & Run

```bash
# 1. Install backend dependencies
cd server
npm install

# 2. Start the backend server
node src/server.js
# → Running on http://localhost:5000

# 3. In a new terminal, install frontend dependencies
cd client
npm install

# 4. Start the frontend dev server
npm run dev
# → Running on http://localhost:5173
```


## What We'd Build Next

With more time, we would add **real-time collaborative editing via CRDTs** (Yjs) so multiple researchers can edit simultaneously with cursor presence; **MongoDB Atlas Vector Search indexes** for production-scale semantic retrieval; **codebase ingestion** with AST-aware chunking for Jupyter notebooks and Python scripts; **OAuth authentication** with team workspaces; and a **visual commit DAG graph** rendered with D3.js to show branching history the way GitHub's network graph does.

---

## Project Structure

```
git-for-research/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # UI components (Primer-styled)
│   │   │   ├── ArtifactEditor.jsx
│   │   │   ├── AskAIModal.jsx
│   │   │   ├── BranchSelector.jsx
│   │   │   ├── CommitModal.jsx
│   │   │   ├── DiffViewer.jsx
│   │   │   ├── ImportModal.jsx
│   │   │   ├── MergeConflict.jsx
│   │   │   ├── Presence.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── VersionHistory.jsx
│   │   │   └── WorkspaceHeader.jsx
│   │   ├── pages/
│   │   │   └── Workspace.jsx  # Main orchestrator page
│   │   ├── services/
│   │   │   ├── api.js         # REST API client
│   │   │   └── socket.js      # Socket.IO client
│   │   ├── data/
│   │   │   └── mockData.js    # Fallback mock data
│   │   ├── index.css          # GitHub Primer dark theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                    # Express.js backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── artifactController.js
│   │   │   └── ingestController.js
│   │   ├── models/
│   │   │   ├── Artifact.js
│   │   │   ├── Branch.js
│   │   │   ├── Chunk.js
│   │   │   └── Commit.js
│   │   ├── routes/
│   │   │   └── artifactRoutes.js
│   │   ├── services/
│   │   │   ├── embeddingService.js
│   │   │   ├── ingestionService.js
│   │   │   ├── mergeService.js
│   │   │   ├── ragService.js
│   │   │   └── socketService.js
│   │   └── server.js
│   └── package.json
└── README.md
```

---

**Team:** Mouli · Built at Screen Out Hackathon 2026
