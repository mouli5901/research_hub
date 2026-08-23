import React from 'react';
import BranchSelector from './BranchSelector';
import Presence from './Presence';
import { 
  GitCommit, 
  History, 
  GitCompare, 
  GitMerge, 
  Upload, 
  Search,
  Sparkles,
  FileText,
  BookOpen,
  Plus
} from 'lucide-react';

export default function WorkspaceHeader({
  activeArtifact,
  branches,
  currentBranch,
  onSelectBranch,
  onCreateBranch,
  onOpenCommitModal,
  onToggleHistory,
  isHistoryOpen,
  activeView,
  setActiveView,
  onOpenImportModal,
  onOpenSearchModal,
  onOpenAskAIModal,
  activeUsers
}) {
  const artifactName = activeArtifact ? activeArtifact.name : 'Select Artifact';

  return (
    <header className="workspace-header">
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div className="repo-breadcrumb">
          <BookOpen size={18} style={{ color: 'var(--color-fg-muted)' }} />
          <a href="#">research-hub</a>
          <span style={{ color: 'var(--color-fg-muted)' }}>/</span>
          <span>{artifactName}</span>
          <span className="repo-badge">Public</span>
        </div>

        {/* Toolbar Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Presence users={activeUsers} />

          <BranchSelector
            branches={branches}
            currentBranch={currentBranch}
            onSelectBranch={onSelectBranch}
            onCreateBranch={onCreateBranch}
          />

          <button className="btn btn-primary" onClick={onOpenCommitModal}>
            <GitCommit size={14} />
            <span>Commit</span>
          </button>

          <button 
            className={`btn ${isHistoryOpen ? 'btn-primary' : ''}`}
            onClick={onToggleHistory}
          >
            <History size={14} />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* GitHub Primer Sub-nav Tabs */}
      <div className="subnav-tabs">
        <button 
          className={`subnav-tab ${activeView === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveView('editor')}
        >
          <FileText size={15} />
          <span>Code / Document</span>
        </button>

        <button 
          className={`subnav-tab ${activeView === 'diff' ? 'active' : ''}`}
          onClick={() => setActiveView('diff')}
        >
          <GitCompare size={15} />
          <span>Semantic Diff</span>
        </button>

        <button 
          className={`subnav-tab ${activeView === 'merge' ? 'active' : ''}`}
          onClick={() => setActiveView('merge')}
        >
          <GitMerge size={15} />
          <span>Merge & Conflicts</span>
        </button>

        <button 
          className="subnav-tab"
          onClick={onOpenAskAIModal}
        >
          <Sparkles size={15} style={{ color: 'var(--color-purple-fg)' }} />
          <span>Ask AI</span>
        </button>
      </div>
    </header>
  );
}
