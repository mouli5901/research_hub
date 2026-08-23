import React, { useState } from 'react';
import { X, GitCommit, GitBranch, CheckCircle2 } from 'lucide-react';

export default function CommitModal({ isOpen, onClose, currentBranch, activeArtifact, onCreateCommit }) {
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('Mouli');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onCreateCommit({
        message: message.trim(),
        branch: currentBranch,
        author: author.trim()
      });
      setMessage('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCommit size={18} style={{ color: 'var(--color-accent-fg)' }} />
            <span>Commit Changes to {currentBranch || 'main'}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-fg-subtle)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-fg-muted)', marginBottom: '4px' }}>
                Commit Message *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Updated methodology and benchmark precision"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-fg-muted)', marginBottom: '4px' }}>
                Author
              </label>
              <input
                type="text"
                className="input-field"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <GitBranch size={13} style={{ color: 'var(--color-accent-fg)' }} />
              <span>Target Branch: <strong>{currentBranch || 'main'}</strong></span>
            </div>
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border-default)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--color-canvas-inset)' }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!message.trim()}>
              <CheckCircle2 size={14} /> Commit Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
