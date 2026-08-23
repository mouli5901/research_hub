import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import WorkspaceHeader from '../components/WorkspaceHeader';
import ArtifactEditor from '../components/ArtifactEditor';
import VersionHistory from '../components/VersionHistory';
import DiffViewer from '../components/DiffViewer';
import MergeConflict from '../components/MergeConflict';
import ImportModal from '../components/ImportModal';
import SearchResults from '../components/SearchResults';
import CommitModal from '../components/CommitModal';
import AskAIModal from '../components/AskAIModal';

import {
  fetchArtifacts,
  createArtifact as createArtifactAPI,
  ingestArtifactAPI,
  fetchCommits,
  createCommit as createCommitAPI,
  fetchBranches,
  createBranch as createBranchAPI,
  fetchDiff,
  mergeBranches as mergeBranchesAPI,
  fetchChangesSince
} from '../services/api';

import {
  joinArtifactRoom,
  updatePresenceStatus,
  leaveArtifactRoom,
  subscribeToPresence,
  subscribeToNewCommits
} from '../services/socket';

import { 
  MOCK_USERS, 
  MOCK_CONFLICT_DATA,
  MOCK_SEARCH_RESULTS 
} from '../data/mockData';

export default function Workspace() {
  // Navigation & View States
  const [activeNav, setActiveNav] = useState('all-docs');
  const [activeView, setActiveView] = useState('editor'); // 'editor' | 'diff' | 'merge'
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  // API Data States
  const [artifacts, setArtifacts] = useState([]);
  const [activeArtifactId, setActiveArtifactId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [commits, setCommits] = useState([]);
  const [activeCommit, setActiveCommit] = useState(null);

  // Real-time Collaboration & Presence States
  const [roomUsers, setRoomUsers] = useState([]);
  const [lastSeenCommitId, setLastSeenCommitId] = useState(null);
  const [newChangesInfo, setNewChangesInfo] = useState(null);
  const [staleVersionError, setStaleVersionError] = useState(null);

  // Diff API States
  const [diffData, setDiffData] = useState(null);
  const [baseCommitId, setBaseCommitId] = useState('');
  const [compareCommitId, setCompareCommitId] = useState('');
  const [isLoadingDiff, setIsLoadingDiff] = useState(false);

  // Merge API States
  const [conflictData, setConflictData] = useState(MOCK_CONFLICT_DATA);
  const [isLoadingMerge, setIsLoadingMerge] = useState(false);

  // Editor draft content state
  const [draftContent, setDraftContent] = useState('');

  // UI Loading & Error States
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(true);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isAskAIModalOpen, setIsAskAIModalOpen] = useState(false);

  const currentUser = MOCK_USERS.find(u => u.isCurrentUser) || MOCK_USERS[0];
  const activeArtifact = artifacts.find(a => (a._id || a.id) === activeArtifactId) || artifacts[0];

  // 1. Load Artifacts on Mount
  const loadArtifacts = useCallback(async () => {
    setIsLoadingArtifacts(true);
    setErrorMessage(null);
    try {
      let data = await fetchArtifacts();
      
      // Seed default artifact if DB is empty for demo convenience
      if (!data || data.length === 0) {
        const seeded = await createArtifactAPI({
          name: 'DeepSeek_R1_Architectural_Synthesis.md',
          type: 'markdown',
          content: `# DeepSeek-R1 Architecture & Semantic Retrieval Benchmark\n\n## 1. Abstract\nThis document outlines our research on low-cost reasoning models and semantic retrieval strategies for scientific corpora.\n\n## 2. Research Hypothesis & Problem Statement\nThe system uses keyword-based retrieval.\n\n## 3. Empirical Evaluation & Accuracy Metrics\n- Baseline Accuracy: 74% precision using TF-IDF\n- Experimental Accuracy: The model achieved 82% accuracy.`,
          message: 'Initial research import',
          author: 'Mouli',
          branch: 'main'
        });
        data = [seeded.artifact];
      }

      setArtifacts(data);
      if (data.length > 0 && !activeArtifactId) {
        setActiveArtifactId(data[0]._id || data[0].id);
      }
    } catch (err) {
      console.error('Error loading artifacts from API:', err);
      setErrorMessage(`API Connection Error: Could not reach backend at ${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`);
    } finally {
      setIsLoadingArtifacts(false);
    }
  }, [activeArtifactId]);

  useEffect(() => {
    loadArtifacts();
  }, []);

  // 2. Load Branches and Commits whenever activeArtifactId or currentBranch changes
  const loadArtifactData = useCallback(async () => {
    if (!activeArtifactId) return;

    setIsLoadingCommits(true);
    try {
      // Fetch Branches for selected artifact
      const branchList = await fetchBranches(activeArtifactId);
      setBranches(branchList);

      // Verify currentBranch exists in branchList, else fallback to 'main'
      const branchNames = branchList.map(b => b.name);
      let selectedBranchName = currentBranch;
      if (branchList.length > 0 && !branchNames.includes(currentBranch)) {
        selectedBranchName = branchList[0].name || 'main';
        setCurrentBranch(selectedBranchName);
      }

      // Fetch Commits for selected artifact and branch
      const commitList = await fetchCommits(activeArtifactId, selectedBranchName);
      setCommits(commitList);

      if (commitList.length > 0) {
        const headC = commitList[0];
        setActiveCommit(headC);
        setDraftContent(headC.content || '');

        // Set lastSeenCommitId if not set
        if (!lastSeenCommitId) {
          setLastSeenCommitId(headC._id);
        }
      } else {
        setActiveCommit(null);
      }
    } catch (err) {
      console.error('Error loading branches/commits from API:', err);
      setErrorMessage('Failed to load version history for the selected branch.');
    } finally {
      setIsLoadingCommits(false);
    }
  }, [activeArtifactId, currentBranch, lastSeenCommitId]);

  useEffect(() => {
    if (activeArtifactId) {
      loadArtifactData();
    }
  }, [activeArtifactId, currentBranch, loadArtifactData]);

  // 3. Socket.IO Real-time Presence & Room Management
  useEffect(() => {
    if (!activeArtifactId) return;

    joinArtifactRoom(activeArtifactId, currentUser, 'viewing', lastSeenCommitId || '');

    const unsubscribePresence = subscribeToPresence((data) => {
      if (data && data.activeUsers) {
        setRoomUsers(data.activeUsers);
      }
    });

    const unsubscribeNewCommit = subscribeToNewCommits((data) => {
      // When a new commit is created by another user in this room
      loadArtifactData();
      if (lastSeenCommitId && data.commit && data.commit._id !== lastSeenCommitId) {
        checkChangesSince(lastSeenCommitId);
      }
    });

    return () => {
      unsubscribePresence();
      unsubscribeNewCommit();
      leaveArtifactRoom(activeArtifactId);
    };
  }, [activeArtifactId, currentUser, lastSeenCommitId, loadArtifactData]);

  // 4. Check "What has changed since I last looked?"
  const checkChangesSince = useCallback(async (commitId) => {
    if (!activeArtifactId || !commitId) return;
    try {
      const res = await fetchChangesSince(activeArtifactId, {
        lastSeenCommit: commitId,
        branch: currentBranch
      });
      if (res.hasNewChanges) {
        setNewChangesInfo(res);
      } else {
        setNewChangesInfo(null);
      }
    } catch (err) {
      console.error('Error checking changes since:', err);
    }
  }, [activeArtifactId, currentBranch]);

  useEffect(() => {
    if (activeArtifactId && lastSeenCommitId) {
      checkChangesSince(lastSeenCommitId);
    }
  }, [activeArtifactId, lastSeenCommitId, currentBranch, checkChangesSince]);

  // 5. Load Real Semantic Diff when Diff View is Active
  const loadDiffData = useCallback(async () => {
    if (!activeArtifactId || activeView !== 'diff') return;

    setIsLoadingDiff(true);
    try {
      const allCommits = await fetchCommits(activeArtifactId);
      
      let baseC = baseCommitId;
      let compareC = compareCommitId;

      if (!baseC && allCommits.length > 1) {
        baseC = allCommits[allCommits.length - 1]._id;
      } else if (!baseC && allCommits.length === 1) {
        baseC = allCommits[0]._id;
      }

      if (!compareC && allCommits.length > 0) {
        compareC = allCommits[0]._id;
      }

      const result = await fetchDiff(activeArtifactId, {
        baseCommit: baseC,
        compareCommit: compareC,
        baseBranch: 'main',
        compareBranch: currentBranch
      });

      setDiffData(result);
      if (baseC) setBaseCommitId(baseC);
      if (compareC) setCompareCommitId(compareC);
    } catch (err) {
      console.error('Error loading semantic diff from API:', err);
    } finally {
      setIsLoadingDiff(false);
    }
  }, [activeArtifactId, activeView, baseCommitId, compareCommitId, currentBranch]);

  useEffect(() => {
    loadDiffData();
  }, [loadDiffData]);

  // Handlers
  const handleSelectBranch = (branchName) => {
    setCurrentBranch(branchName);
  };

  const handleCreateBranch = async (newBranchName) => {
    if (!activeArtifactId) return;
    try {
      await createBranchAPI(activeArtifactId, {
        name: newBranchName,
        fromBranch: currentBranch
      });
      setCurrentBranch(newBranchName);
      await loadArtifactData();
    } catch (err) {
      alert(`Error creating branch: ${err.message}`);
    }
  };

  const handleUpdateDraftContent = (newContent) => {
    setDraftContent(newContent);
    updatePresenceStatus(activeArtifactId, 'editing', lastSeenCommitId || '');
  };

  const handleCreateCommit = async ({ message, branch, author }) => {
    if (!activeArtifactId) return;
    setStaleVersionError(null);
    try {
      const commitPayload = {
        content: draftContent,
        message,
        branch: branch || currentBranch,
        author: author || currentUser.name,
        expectedHeadCommit: activeCommit?._id // Protect against silent overwrites!
      };

      const res = await createCommitAPI(activeArtifactId, commitPayload);

      // Update lastSeenCommitId to newly created commit
      if (res.commit) {
        setLastSeenCommitId(res.commit._id);
        setNewChangesInfo(null);
      }

      updatePresenceStatus(activeArtifactId, 'viewing', res.commit?._id || '');

      // Refresh version history and branches
      await loadArtifactData();
    } catch (err) {
      if (err.status === 409 || err.code === 'STALE_VERSION_CONFLICT') {
        setStaleVersionError({
          message: err.message,
          details: err.details
        });
      } else {
        alert(`Error saving commit: ${err.message}`);
      }
    }
  };

  const handleCheckMerge = async (targetBranch, sourceBranch) => {
    if (!activeArtifactId) return;
    setIsLoadingMerge(true);
    try {
      const res = await mergeBranchesAPI(activeArtifactId, {
        targetBranch,
        sourceBranch
      });

      if (res.status === 'CONFLICT') {
        setConflictData({
          status: 'CONFLICT',
          artifactName: activeArtifact?.name || 'Document',
          targetBranch: res.targetBranch,
          sourceBranch: res.sourceBranch,
          targetContent: res.targetContent,
          sourceContent: res.sourceContent,
          conflicts: res.conflicts
        });
      } else if (res.status === 'MERGED') {
        setConflictData({
          status: 'RESOLVED_AUTO',
          artifactName: activeArtifact?.name || 'Document',
          targetBranch: res.branch?.name || targetBranch,
          sourceBranch,
          targetContent: res.commit?.content,
          sourceContent: res.commit?.content
        });
        await loadArtifactData();
      }
    } catch (err) {
      alert(`Error evaluating merge: ${err.message}`);
    } finally {
      setIsLoadingMerge(false);
    }
  };

  const handleResolveMerge = async ({ targetBranch, sourceBranch, resolvedContent, resolutionStrategy }) => {
    if (!activeArtifactId) return;
    setIsLoadingMerge(true);
    try {
      const res = await mergeBranchesAPI(activeArtifactId, {
        targetBranch,
        sourceBranch,
        resolvedContent,
        resolutionStrategy,
        author: currentUser.name
      });

      if (res.status === 'MERGED') {
        setConflictData({
          status: `RESOLVED_${resolutionStrategy.toUpperCase()}`,
          artifactName: activeArtifact?.name || 'Document',
          targetBranch: res.branch?.name || targetBranch,
          sourceBranch,
          targetContent: res.commit?.content,
          sourceContent: res.commit?.content
        });

        await loadArtifactData();
      }
    } catch (err) {
      alert(`Error completing merge resolution: ${err.message}`);
    } finally {
      setIsLoadingMerge(false);
    }
  };

  const handleImportArtifact = async (payload) => {
    const res = await ingestArtifactAPI(payload);
    const newArt = res.artifact;

    const updatedArtifacts = await fetchArtifacts();
    setArtifacts(updatedArtifacts);
    setActiveArtifactId(newArt._id || newArt.id);
    setActiveView('editor');
  };

  const handleSelectSearchResult = (result) => {
    const matched = artifacts.find(a => a.name === result.source || a.name.includes(result.title));
    if (matched) {
      setActiveArtifactId(matched._id || matched.id);
      setActiveView('editor');
    }
  };

  return (
    <div className="app-layout">
      {/* 1. GLOBAL SIDEBAR */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        artifacts={artifacts}
        activeArtifactId={activeArtifactId}
        setActiveArtifactId={(id) => {
          setActiveArtifactId(id);
          setActiveView('editor');
          setNewChangesInfo(null);
        }}
        branches={branches}
        currentBranch={currentBranch}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenAskAIModal={() => setIsAskAIModalOpen(true)}
        currentUser={currentUser}
      />

      {/* 2. MAIN WORKSPACE */}
      <main className="main-workspace">
        {/* Error Banner */}
        {errorMessage && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            color: '#fca5a5',
            padding: '8px 16px',
            fontSize: '12px',
            borderBottom: '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>⚠️ {errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>Dismiss</button>
          </div>
        )}

        {/* Changes Since Last Looked Indicator Banner */}
        {newChangesInfo && newChangesInfo.hasNewChanges && (
          <div style={{
            backgroundColor: 'rgba(139, 92, 246, 0.18)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
            padding: '8px 20px',
            fontSize: '12px',
            color: '#c084fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>⚡</span>
              <span>
                <strong>{newChangesInfo.newCommitsCount} new commit(s)</strong> created on branch <code style={{ color: '#93c5fd' }}>{currentBranch}</code> since you last looked.
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (commits.length > 0) {
                    const latestHead = commits[0];
                    setActiveCommit(latestHead);
                    setDraftContent(latestHead.content || '');
                    setLastSeenCommitId(latestHead._id);
                    setNewChangesInfo(null);
                  }
                }}
                style={{ padding: '3px 8px', fontSize: '11px' }}
              >
                Pull Latest Commit
              </button>
              <button 
                className="btn btn-default"
                onClick={() => setIsHistoryOpen(true)}
                style={{ padding: '3px 8px', fontSize: '11px' }}
              >
                View History
              </button>
            </div>
          </div>
        )}

        {/* Stale Version Conflict Protection Alert */}
        {staleVersionError && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.5)',
            padding: '12px 20px',
            fontSize: '13px',
            color: '#fca5a5'
          }}>
            <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠️ STALE VERSION PREVENTED OVERWRITE</span>
            </div>
            <div style={{ fontSize: '12px', color: '#f8fafc', marginBottom: '8px' }}>
              {staleVersionError.message}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  loadArtifactData();
                  setStaleVersionError(null);
                }}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                Update to Head & Review
              </button>
              <button 
                className="btn btn-default"
                onClick={() => setStaleVersionError(null)}
                style={{ padding: '4px 10px', fontSize: '12px' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Workspace Header */}
        <WorkspaceHeader
          activeArtifact={activeArtifact}
          branches={branches}
          currentBranch={currentBranch}
          onSelectBranch={handleSelectBranch}
          onCreateBranch={handleCreateBranch}
          onOpenCommitModal={() => setIsCommitModalOpen(true)}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          isHistoryOpen={isHistoryOpen}
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
          onOpenAskAIModal={() => setIsAskAIModalOpen(true)}
          activeUsers={roomUsers.length > 0 ? roomUsers : MOCK_USERS}
        />

        {/* Core Workspace View: Editor / Diff / Merge */}
        <div className="workspace-content">
          {isLoadingArtifacts ? (
            <div className="editor-area" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              Loading research artifacts from backend...
            </div>
          ) : (
            <>
              {activeView === 'editor' && (
                <ArtifactEditor
                  activeArtifact={activeArtifact}
                  activeCommit={activeCommit ? { ...activeCommit, content: draftContent } : null}
                  onUpdateContent={handleUpdateDraftContent}
                  currentBranch={currentBranch}
                  onSaveCommit={() => setIsCommitModalOpen(true)}
                />
              )}

              {activeView === 'diff' && (
                <DiffViewer
                  diffData={diffData}
                  commits={commits}
                  branches={branches}
                  baseCommitId={baseCommitId}
                  compareCommitId={compareCommitId}
                  onSelectBaseCommit={(id) => setBaseCommitId(id)}
                  onSelectCompareCommit={(id) => setCompareCommitId(id)}
                  isLoading={isLoadingDiff}
                  onRefreshDiff={loadDiffData}
                />
              )}

              {activeView === 'merge' && (
                <MergeConflict
                  branches={branches}
                  conflictData={conflictData}
                  onCheckMerge={handleCheckMerge}
                  onResolveMerge={handleResolveMerge}
                  isLoading={isLoadingMerge}
                />
              )}
            </>
          )}

          {/* 4. VERSION HISTORY PANEL */}
          {isHistoryOpen && (
            <VersionHistory
              commits={commits}
              onClose={() => setIsHistoryOpen(false)}
              activeCommit={activeCommit}
              onSelectCommit={(c) => {
                setActiveCommit(c);
                setDraftContent(c.content || '');
                setLastSeenCommitId(c._id);
                setNewChangesInfo(null);
              }}
              isLoading={isLoadingCommits}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportArtifact={handleImportArtifact}
      />

      <SearchResults
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchResults={MOCK_SEARCH_RESULTS}
        onSelectResult={handleSelectSearchResult}
      />

      <CommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        currentBranch={currentBranch}
        activeArtifact={activeArtifact}
        onCreateCommit={handleCreateCommit}
      />

      <AskAIModal
        isOpen={isAskAIModalOpen}
        onClose={() => setIsAskAIModalOpen(false)}
        onSelectArtifact={(name) => {
          const matched = artifacts.find(a => a.name === name);
          if (matched) setActiveArtifactId(matched._id || matched.id);
        }}
      />
    </div>
  );
}
