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
  Folder,
  Plus
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
  currentUser,
  onUpdateUser,
  onCreateNewDocument
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
          {onCreateNewDocument && (
            <button
              onClick={(e) => { e.stopPropagation(); onCreateNewDocument(); }}
              title="Create new document"
              style={{ background: 'none', border: 'none', color: 'var(--color-fg-muted)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {artifacts.length === 0 ? (
          <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: '12px' }}>
            No artifacts yet.<br/>
            <span style={{ fontSize: '11px', color: 'var(--color-fg-subtle)' }}>Import or create one above</span>
          </div>
        ) : (
          artifacts.map((art) => {
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
          })
        )}
      </div>

      {/* 4. Current Branch & User Footer */}
      <div className="sidebar-section" style={{ borderTop: '1px solid var(--color-border-default)', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-fg-muted)', marginBottom: '8px' }}>
          <GitBranch size={14} style={{ color: 'var(--color-accent-fg)' }} />
          <span>Branch: <strong style={{ color: 'var(--color-fg-default)' }}>{currentBranch}</strong></span>
        </div>

        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-fg-default)', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', transition: 'background 0.15s' }}
          onClick={() => {
            const newName = window.prompt('Enter your name for research commit attribution & presence:', currentUser?.name || '');
            if (newName && newName.trim()) {
              if (onUpdateUser) onUpdateUser({ ...currentUser, name: newName.trim() });
            }
          }}
          title="Click to change your collaborator name"
        >
          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: currentUser?.avatarBg || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 600, flexShrink: 0 }}>
            {(currentUser?.name || 'R').charAt(0).toUpperCase()}
          </div>
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100px' }}>
            {currentUser?.name || 'Researcher'}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--color-accent-fg)', marginLeft: 'auto', border: '1px solid var(--color-border-default)', padding: '1px 5px', borderRadius: '4px' }}>
            Edit
          </span>
        </div>
      </div>
    </aside>
  );
}
