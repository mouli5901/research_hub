import React from 'react';
import { 
  GitBranch, 
  FileText, 
  MessageSquare, 
  File, 
  Search, 
  Upload, 
  Sparkles,
  User,
  BookOpen,
  Layers,
  Folder
} from 'lucide-react';

export default function Sidebar({ 
  activeNav, 
  setActiveNav, 
  artifacts = [], 
  activeArtifactId, 
  setActiveArtifactId,
  branches = [],
  currentBranch,
  onOpenImportModal,
  onOpenSearchModal,
  onOpenAskAIModal,
  currentUser
}) {
  const getArtifactIcon = (type) => {
    switch (type) {
      case 'chat': return <MessageSquare size={14} className="text-purple-400" />;
      case 'pdf': return <File size={14} className="text-red-400" />;
      case 'code': return <BookOpen size={14} className="text-emerald-400" />;
      default: return <FileText size={14} className="text-blue-400" />;
    }
  };

  return (
    <aside className="sidebar">
      {/* 1. Header Branding */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <BookOpen size={20} style={{ color: 'var(--color-accent-fg)' }} />
          <span>ResearchHub</span>
        </div>
      </div>

      {/* 2. Navigation Actions */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Core Actions</div>
        
        <div 
          className={`nav-item ${activeNav === 'search' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('search');
            onOpenSearchModal();
          }}
        >
          <Search size={15} />
          <span>Corpus Search</span>
          <kbd style={{ fontSize: '10px', background: 'var(--color-canvas-inset)', padding: '1px 4px', borderRadius: '3px', marginLeft: 'auto', border: '1px solid var(--color-border-default)' }}>Ctrl K</kbd>
        </div>

        <div 
          className={`nav-item ${activeNav === 'ask-ai' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('ask-ai');
            onOpenAskAIModal();
          }}
        >
          <Sparkles size={15} style={{ color: 'var(--color-purple-fg)' }} />
          <span>Ask AI (Corpus Q&A)</span>
        </div>

        <div 
          className={`nav-item ${activeNav === 'import' ? 'active' : ''}`}
          onClick={() => {
            setActiveNav('import');
            onOpenImportModal();
          }}
        >
          <Upload size={15} />
          <span>Import Artifact</span>
        </div>
      </div>

      {/* 3. Research Artifacts Directory */}
      <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="sidebar-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Artifacts ({artifacts.length})</span>
          <Folder size={13} />
        </div>

        {artifacts.map((art) => {
          const artId = art._id || art.id;
          const isActive = artId === activeArtifactId;
          return (
            <div
              key={artId}
              className={`artifact-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setActiveArtifactId(artId)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {getArtifactIcon(art.type)}
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whitespace: 'nowrap' }}>
                  {art.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Current Branch & User Footer */}
      <div className="sidebar-section" style={{ borderTop: '1px solid var(--color-border-default)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-fg-muted)', marginBottom: '8px' }}>
          <GitBranch size={14} style={{ color: 'var(--color-accent-fg)' }} />
          <span>Branch: <strong style={{ color: 'var(--color-fg-default)' }}>{currentBranch}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-fg-default)' }}>
          <User size={14} />
          <span>{currentUser?.name || 'Mouli'}</span>
          <span style={{ fontSize: '10px', color: 'var(--color-fg-subtle)', marginLeft: 'auto' }}>Collaborator</span>
        </div>
      </div>
    </aside>
  );
}
