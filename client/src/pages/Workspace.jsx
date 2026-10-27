import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Upload, Plus } from 'lucide-react';
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

import { getCurrentUser, saveCurrentUser } from '../services/userService';

import { 
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
  const [isOfflineMode, setIsOfflineMode] = useState(false);

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

  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const activeArtifact = artifacts.find(a => (a._id || a.id) === activeArtifactId) || (artifacts.length > 0 ? artifacts[0] : null);

  const handleUpdateUser = (newUser) => {
    saveCurrentUser(newUser);
    setCurrentUser(newUser);
  };

  // 1. Load Artifacts on Mount
  const loadArtifacts = useCallback(async () => {
    setIsLoadingArtifacts(true);
    setErrorMessage(null);
    try {
      const data = await fetchArtifacts();
      const list = Array.isArray(data) ? data : [];
      setArtifacts(list);
      setIsOfflineMode(false);
      if (list.length > 0) {
        if (!activeArtifactId || !list.some(a => (a._id || a.id) === activeArtifactId)) {
          setActiveArtifactId(list[0]._id || list[0].id);
        }
      } else {
        setActiveArtifactId(null);
      }
    } catch (err) {
      console.warn('API error fetching artifacts:', err);
      setArtifacts([]);
      setActiveArtifactId(null);
      setIsOfflineMode(true);
      setErrorMessage('Could not connect to database. Please check your connection.');
    } finally {
      setIsLoadingArtifacts(false);
    }
  }, [activeArtifactId]);

  useEffect(() => {
    loadArtifacts();
  }, []);

  // 2. Load Branches and Commits whenever activeArtifactId or currentBranch changes
  const loadArtifactData = useCallback(async () => {
    if (!activeArtifactId) {
      setBranches([]);
      setCommits([]);
      setActiveCommit(null);
      setDraftContent('');
      return;
    }

    setIsLoadingCommits(true);
    try {
      // Fetch Branches for selected artifact
      let branchList = [];
      try {
        branchList = await fetchBranches(activeArtifactId);
      } catch (err) {
        console.warn('Error fetching branches:', err);
      }
      if (!branchList || branchList.length === 0) {
        branchList = [{ id: 'main', name: 'main', description: 'Primary branch' }];
      }
      setBranches(branchList);

      // Verify currentBranch exists in branchList, else fallback to first branch or 'main'
      const branchNames = branchList.map(b => b.name);
      let selectedBranchName = currentBranch;
      if (!branchNames.includes(currentBranch)) {
        selectedBranchName = branchNames[0] || 'main';
        setCurrentBranch(selectedBranchName);
      }

      // Fetch Commits for selected artifact and branch
      let commitList = [];
      try {
        commitList = await fetchCommits(activeArtifactId, selectedBranchName);
      } catch (err) {
        console.warn('Error fetching commits:', err);
      }
      setCommits(commitList || []);

      if (commitList && commitList.length > 0) {
        const headC = commitList[0];
        setActiveCommit(headC);
        setDraftContent(headC.content || activeArtifact?.content || '');

        if (!lastSeenCommitId) {
          setLastSeenCommitId(headC._id || headC.id);
        }
      } else {
        setActiveCommit(null);
        setDraftContent(activeArtifact?.content || '');
      }
    } catch (err) {
      console.warn('Error loading branches/commits:', err);
    } finally {
      setIsLoadingCommits(false);
    }
  }, [activeArtifactId, currentBranch, lastSeenCommitId, activeArtifact]);

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
      let allCommits = [];
      try {
        allCommits = await fetchCommits(activeArtifactId);
      } catch (e) {
        allCommits = commits.length > 0 ? commits : MOCK_COMMITS;
      }
      
      let baseC = baseCommitId;
      let compareC = compareCommitId;

      if (!baseC && allCommits.length > 1) {
        baseC = allCommits[allCommits.length - 1]._id || allCommits[allCommits.length - 1].id;
      } else if (!baseC && allCommits.length === 1) {
        baseC = allCommits[0]._id || allCommits[0].id;
      }

      if (!compareC && allCommits.length > 0) {
        compareC = allCommits[0]._id || allCommits[0].id;
      }

      let result = null;
      try {
        result = await fetchDiff(activeArtifactId, {
          baseCommit: baseC,
          compareCommit: compareC,
          baseBranch: 'main',
          compareBranch: currentBranch
        });
      } catch (err) {
        result = MOCK_DIFF_DATA;
      }

      setDiffData(result || MOCK_DIFF_DATA);
      if (baseC) setBaseCommitId(baseC);
      if (compareC) setCompareCommitId(compareC);
    } catch (err) {
      console.warn('Error loading semantic diff:', err);
      setDiffData(MOCK_DIFF_DATA);
    } finally {
      setIsLoadingDiff(false);
    }
  }, [activeArtifactId, activeView, baseCommitId, compareCommitId, currentBranch, commits]);

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
        fromBranch: currentBranch,
        author: currentUser.name,
        userId: currentUser.id
      });
      setCurrentBranch(newBranchName);
      await loadArtifactData();
    } catch (err) {
      console.warn('API create branch error:', err);
      const newB = { id: newBranchName, name: newBranchName, description: 'User created branch' };
      setBranches(prev => [...prev, newB]);
      setCurrentBranch(newBranchName);
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
        userId: currentUser.id,
        expectedHeadCommit: activeCommit?._id || activeCommit?.id
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
        console.warn('API commit error:', err);
        const newCommit = {
          id: 'c-' + Date.now().toString(16),
          _id: 'c-' + Date.now().toString(16),
          hash: Math.random().toString(16).substring(2, 9),
          shortHash: Math.random().toString(16).substring(2, 9),
          message,
          author: author || currentUser.name,
          time: 'Just now',
          branch: branch || currentBranch,
          content: draftContent,
          artifactName: activeArtifact?.name || 'Document'
        };
        setCommits(prev => [newCommit, ...prev]);
        setActiveCommit(newCommit);
        setIsCommitModalOpen(false);
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
      console.warn('Live merge check error:', err);
      setConflictData(MOCK_CONFLICT_DATA);
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
        author: currentUser.name,
        userId: currentUser.id
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
      console.warn('API resolve merge error:', err);
      setConflictData({
        status: `RESOLVED_${(resolutionStrategy || 'manual').toUpperCase()}`,
        artifactName: activeArtifact?.name || 'Document',
        targetBranch: 'main',
        sourceBranch: currentBranch,
        targetContent: resolvedContent,
        sourceContent: resolvedContent
      });
      setDraftContent(resolvedContent);
    } finally {
      setIsLoadingMerge(false);
    }
  };

  const handleImportArtifact = async (payload) => {
    try {
      if (payload instanceof FormData) {
        if (!payload.has('author')) payload.append('author', currentUser.name);
        if (!payload.has('userId')) payload.append('userId', currentUser.id);
      } else if (payload && typeof payload === 'object') {
        payload.author = payload.author || currentUser.name;
        payload.userId = payload.userId || currentUser.id;
      }

      const res = await ingestArtifactAPI(payload);
      const newArt = res.artifact;

      const updatedArtifacts = await fetchArtifacts();
      setArtifacts(updatedArtifacts);
      if (newArt) {
        setActiveArtifactId(newArt._id || newArt.id);
      }
      setActiveView('editor');
    } catch (err) {
      console.warn('API import failed:', err);
      setErrorMessage('Failed to import document: ' + (err.message || 'Network/Server error'));
    }
  };

  const handleCreateNewDocument = async () => {
    try {
      const docName = `Research_Notes_${new Date().toISOString().slice(0, 10)}.md`;
      const res = await createArtifactAPI({
        name: docName,
        type: 'markdown',
        content: `# New Research Artifact\n\nAuthor: ${currentUser.name}\nDate: ${new Date().toLocaleDateString()}\n\n## Abstract\nStart documenting your research methodology, empirical data, and synthesis here...`,
        message: 'Initial research artifact creation',
        author: currentUser.name,
        userId: currentUser.id,
        branch: 'main'
      });
      const newArt = res.artifact || res;
      await loadArtifacts();
      if (newArt) {
        setActiveArtifactId(newArt._id || newArt.id);
        setActiveView('editor');
      }
    } catch (err) {
      console.error('Failed to create new document:', err);
      setErrorMessage('Failed to create document: ' + (err.message || 'Server error'));
    }
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
        onUpdateUser={handleUpdateUser}
        onCreateNewDocument={handleCreateNewDocument}
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
          activeUsers={roomUsers.length > 0 ? roomUsers : [currentUser]}
          isOfflineMode={isOfflineMode}
        />

        {/* Core Workspace View: Editor / Diff / Merge */}
        <div className="workspace-content">
          {isLoadingArtifacts ? (
            <div className="editor-area" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
              Loading research artifacts from backend...
            </div>
          ) : artifacts.length === 0 ? (
            <div className="editor-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', marginBottom: '4px' }}>
                <FileText size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f8fafc' }}>No Research Artifacts Yet</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '440px', lineHeight: 1.6 }}>
                Welcome, <strong>{currentUser.name}</strong>! Your repository is ready. Import an existing paper, PDF, or markdown file, or create a fresh document to begin versioning your research.
              </p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button className="btn btn-primary" onClick={() => setIsImportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                  <Upload size={16} /> Import Research File
                </button>
                <button className="btn btn-default" onClick={handleCreateNewDocument} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                  <Plus size={16} /> Create Blank Document
                </button>
              </div>
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
        currentUser={currentUser}
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
        currentUser={currentUser}
      />

      <AskAIModal
        isOpen={isAskAIModalOpen}
        onClose={() => setIsAskAIModalOpen(false)}
        artifacts={artifacts}
        onSelectArtifact={(name) => {
          const matched = artifacts.find(a => a.name === name);
          if (matched) setActiveArtifactId(matched._id || matched.id);
        }}
      />
    </div>
  );
}
