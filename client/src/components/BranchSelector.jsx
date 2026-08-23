import React, { useState } from 'react';
import { GitBranch, ChevronDown, Plus, Check } from 'lucide-react';

export default function BranchSelector({ branches = [], currentBranch, onSelectBranch, onCreateBranch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e) => {
    e.preventDefault();
    if (newBranchName.trim()) {
      onCreateBranch(newBranchName.trim());
      setNewBranchName('');
      setIsCreating(false);
      setIsOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <GitBranch size={14} style={{ color: 'var(--color-fg-muted)' }} />
        <span style={{ fontWeight: 600 }}>{currentBranch || 'main'}</span>
        <ChevronDown size={14} style={{ color: 'var(--color-fg-subtle)' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '4px',
          width: '260px',
          backgroundColor: 'var(--color-canvas-subtle)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-medium)',
          boxShadow: '0 8px 24px rgba(1, 4, 9, 0.4)',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--color-border-default)',
            fontWeight: 600,
            fontSize: '12px',
            color: 'var(--color-fg-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Switch branches</span>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-fg)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}
              >
                <Plus size={12} /> New
              </button>
            )}
          </div>

          {isCreating ? (
            <form onSubmit={handleCreate} style={{ padding: '8px 12px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="New branch name..."
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                autoFocus
                style={{ fontSize: '12px', marginBottom: '8px' }}
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-sm" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Create
                </button>
              </div>
            </form>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {branches.map((b) => {
                const isSelected = b.name === currentBranch;
                return (
                  <div
                    key={b._id || b.id || b.name}
                    onClick={() => {
                      onSelectBranch(b.name);
                      setIsOpen(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: isSelected ? 'var(--color-fg-default)' : 'var(--color-fg-muted)',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: isSelected ? 'var(--color-accent-subtle)' : 'transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <GitBranch size={13} style={{ color: isSelected ? 'var(--color-accent-fg)' : 'var(--color-fg-subtle)' }} />
                      <span>{b.name}</span>
                    </div>
                    {isSelected && <Check size={14} style={{ color: 'var(--color-accent-fg)' }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
