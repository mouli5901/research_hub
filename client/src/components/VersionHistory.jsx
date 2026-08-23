import React from 'react';
import { History, GitCommit, User, Clock, X } from 'lucide-react';

export default function VersionHistory({ commits = [], onClose, activeCommit, onSelectCommit, isLoading }) {
  return (
    <aside className="history-panel">
      <div className="history-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={16} style={{ color: 'var(--color-fg-muted)' }} />
          <span>Commit History ({commits.length})</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-fg-subtle)', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: '12px' }}>
            Loading commits...
          </div>
        ) : commits.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-fg-muted)', fontSize: '12px' }}>
            No commit history found for this branch.
          </div>
        ) : (
          commits.map((c) => {
            const commitIdStr = c._id ? c._id.toString() : '';
            const shortSha = commitIdStr ? commitIdStr.substring(commitIdStr.length - 7) : 'commit';
            const isActive = activeCommit && activeCommit._id === c._id;
            const timeAgo = c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently';

            return (
              <div 
                key={c._id || c.id}
                className={`timeline-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCommit(c)}
              >
                <div className="timeline-badge" />
                <div className="commit-title">{c.message}</div>
                <div className="commit-meta">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-fg-default)' }}>
                    <User size={12} /> {c.author || 'Mouli'}
                  </span>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={11} /> {timeAgo}
                  </span>
                  <span className="sha-pill" style={{ marginLeft: 'auto' }}>
                    {shortSha}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
