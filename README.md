# ResearchHub — Git for Research

[Insert Video Demo Link Here]

A version-control and collaboration platform built for research artifacts — documents, LLM chat exports, and PDFs — with semantic diffing, branching, real-time live presence, and AI-powered retrieval.

---

## 🌟 Key Features

- **Multi-Format Ingestion:** Upload or paste content from Markdown, Plaintext, ChatGPT/Claude JSON exports, or text-extractable PDFs.
- **Advanced Version Control:**
  - Git-like branch management (create, switch, merge).
  - Sentence-level semantic diffing.
  - Conflict detection and three-way merging.
- **Concurrent Context Layer:**
  - Real-time live presence via Socket.IO.
  - "Changes since I last looked" indicator banner.
  - Stale-version conflict alert (HTTP 409) preventing silent data clobbering.
- **AI-Powered Retrieval (RAG):**
  - Text chunking (~400 characters) and vector embeddings.
  - "Ask AI" feature providing grounded answers with provenance citations to specific artifact commits and branches.
  - Hybrid vector and keyword search.

---

## 🛠 Technology Stack

### Frontend
- **React (Vite):** Fast, modern UI framework.
- **Lucide React:** Iconography.
- **Socket.IO Client:** Real-time presence updates.

### Backend
- **Express.js:** Lightweight API server framework.
- **Socket.IO:** Real-time, bi-directional communication.
- **Mongoose / MongoDB Atlas:** Document database for storing artifacts, commits, branches, and chunked vector embeddings.
- **Multer:** Multipart file upload handling.
- **@google/genai / OpenAI API (Optional via Env):** Vector embeddings and LLM integrations.

---

## 🏗 Architecture & Data Flow

```text
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

1. **Ingestion Flow:** User uploads a file. The Backend `ingestionService` parses and normalizes the text. The system creates an `Artifact`, an initial `Commit`, and a default `Branch`.
2. **Versioning Flow:** Edits generate new Commits on specific Branches. The semantic diff compares text, while the 3-way merge service detects conflicts using Lowest Common Ancestor (LCA) algorithms.
3. **Retrieval Flow:** Commits are chunked and embedded via `embeddingService`. The `ragService` queries these embeddings using cosine similarity to answer questions with verifiable provenance.

---

## 📂 Folder Structure

```text
git-for-research/
├── client/                      # Frontend Application
│   ├── src/
│   │   ├── components/          # Reusable UI elements (Editor, Modals, DiffViewer)
│   │   ├── pages/               # Main pages (e.g., Workspace.jsx)
│   │   └── services/            # API and Socket.IO client instances
│   ├── vite.config.js
│   └── package.json
├── server/                      # Backend Application
│   ├── src/
│   │   ├── controllers/         # Request handling logic (Artifact, Ingest)
│   │   ├── models/              # Mongoose schemas (Artifact, Branch, Chunk, Commit)
│   │   ├── routes/              # Express API route definitions
│   │   ├── services/            # Core logic (Embeddings, Merge, RAG, Socket)
│   │   └── server.js            # Express & Socket.IO server initialization
│   ├── .env.example             # Template for required environment variables
│   └── package.json
├── package.json                 # Monorepo root configuration
└── vercel.json                  # Deployment configuration
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Cluster (Local or Atlas Network Access set to 0.0.0.0/0 for connection)

### 1. Environment Configuration
Navigate to the backend directory and create a `.env` file based on `.env.example`:

```bash
cd server
cp .env.example .env
```
Ensure you configure your MongoDB connection string in the `server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.cuchzss.mongodb.net/?appName=Cluster0
```

*(Note: Additional environment variables like `OPENAI_API_KEY` or `GEMINI_API_KEY` can be used by the codebase to enable real LLMs; if omitted, the app falls back to local deterministic embeddings and context synthesis).*

### 2. Run the Backend Server
```bash
cd server
npm install
npm run dev     # OR npm start
```
The server will start on `http://localhost:5000`.

### 3. Run the Frontend Client
Open a new terminal window:
```bash
cd client
npm install
npm run dev
```
The client will be available at `http://localhost:5173`.

---

## 📚 API Documentation

Base API path: `/api/artifacts`

| Method | Endpoint | Description | Request Body / Params |
|--------|----------|-------------|-----------------------|
| `POST` | `/ingest` | Upload a file or paste text to create an artifact. | `Multipart form data` (file, name, type, content, branch, author) |
| `GET`  | `/search` | Search indexed artifacts and chunks. | Query: `q` (search term), `type` (optional artifact type filter) |
| `POST` | `/ask-ai` | Ask a question utilizing version-aware RAG over the artifact corpus. | JSON: `{ "question": "Your question here" }` |
| `POST` | `/` | Create an empty artifact manually. | JSON: `{ "name", "type", "description", "defaultBranch", "author" }` |
| `GET`  | `/` | Retrieve all artifacts. | None |
| `GET`  | `/:id` | Get details for a specific artifact by ID. | Path: `id` |
| `GET`  | `/:id/changes-since`| Get new commits since a specific timestamp/commit. | Query: `lastSeenCommit`, `branch` |
| `GET`  | `/:id/diff` | Get semantic diff between two commits or branches. | Query: `baseCommit`, `compareCommit`, `baseBranch`, `compareBranch` |
| `POST` | `/:id/merge` | 3-way merge `sourceBranch` into `targetBranch`. | JSON: `{ "targetBranch", "sourceBranch", "resolvedContent" (if resolving conflict), "resolutionStrategy" }` |
| `POST` | `/:id/commits`| Create a new commit (version) for an artifact. | JSON: `{ "content", "parentCommit", "branch", "message", "author" }` |
| `GET`  | `/:id/commits`| Get commit history for an artifact. | Path: `id`, Query: `branch` (optional) |
| `POST` | `/:id/branches`| Create a new branch. | JSON: `{ "name", "fromBranch", "headCommit", "author" }` |
| `GET`  | `/:id/branches`| List all branches for an artifact. | Path: `id` |

---

## 🧪 Testing

Frontend unit and UI tests are configured using Vitest.
```bash
cd client
npx vitest run
```

---

## 🌩 Deployment

The project is configured for deployment via Vercel.
- The root `package.json` triggers `npm run build` targeting the `client` directory.
- `vercel.json` rewrites API requests (`/api/*` and `/socket.io/*`) to the backend serverless functions, serving the React frontend for all other routes.

Make sure to add the necessary Environment Variables (like `MONGODB_URI`) in your Vercel project settings.

---

## ⚠️ Common Issues & Troubleshooting

- **Database Connection Failed (Status 503):** Verify that the `MONGODB_URI` environment variable is correct and that MongoDB Atlas Network Access allows connections from your current IP (or `0.0.0.0/0` during development).
- **Stale Commit Conflicts (Status 409):** You attempted to push a commit to a branch that has moved forward since you last loaded it. Use the UI to pull the latest changes before submitting.
- **Port Conflicts:** If `5000` or `5173` is in use, check your running processes or adjust the port configurations in `.env` and client network request files.