import React, { useState } from 'react';
import { AlertTriangle, GitMerge, CheckCircle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

export default function MergeConflict({
  branches = [],
  conflictData,
  onCheckMerge,
  onResolveMerge,
  isLoading
}) {
  const [targetBranch, setTargetBranch] = useState('main');
  const [sourceBranch, setSourceBranch] = useState('experiment');
  const [manualText, setManualText] = useState('');

  const handleEvaluate = (e) => {
    e.preventDefault();
    if (targetBranch && sourceBranch && targetBranch !== sourceBranch) {
      onCheckMerge(targetBranch, sourceBranch);
    }
  };

  const status = conflictData?.status;
  const isConflict = status === 'CONFLICT';
  const isMerged = status?.startsWith('RESOLVED');

  return (
    <div className="editor-area" style={{ overflowY: 'auto' }}>
      {/* 1. Branch Merge Selection Toolbar */}
      <div style={{
        background: 'var(--color-canvas-subtle)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-small)',
        padding: '16px',
        marginBottom: '16px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '15px', marginBottom: '12px' }}>
          <GitMerge size={18} style={{ color: 'var(--color-accent-fg)' }} />
          <span>Merge Branch into Target</span>
        </div>

        <form onSubmit={handleEvaluate} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>base:</span>
            <select
              className="input-field"
              value={targetBranch}
              onChange={(e) => setTargetBranch(e.target.value)}
              style={{ width: '130px', fontSize: '12px' }}
            >
              {branches.map(b => (
                <option key={b._id || b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <span style={{ color: 'var(--color-fg-subtle)' }}>←</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>compare:</span>
            <select
              className="input-field"
              value={sourceBranch}
              onChange={(e) => setSourceBranch(e.target.value)}
              style={{ width: '130px', fontSize: '12px' }}
            >
              {branches.map(b => (
                <option key={b._id || b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading || targetBranch === sourceBranch}
          >
            {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <GitMerge size={14} />}
            <span>Evaluate Merge</span>
          </button>
        </form>
      </div>

      {/* 2. GitHub PR Mergeability Status Box */}
      {isMerged && (
        <div style={{
          background: 'rgba(46, 160, 67, 0.12)',
          border: '1px solid rgba(46, 160, 67, 0.4)',
          borderRadius: 'var(--radius-small)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          flexShrink: 0
        }}>
          <CheckCircle size={24} style={{ color: 'var(--color-success-fg)' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-success-fg)', fontSize: '14px' }}>
              Pull Request Successfully Merged!
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-fg-muted)' }}>
              Branch <code>{conflictData.sourceBranch}</code> has been merged into <code>{conflictData.targetBranch}</code>.
            </div>
          </div>
        </div>
      )}

      {/* 3. Merge Conflict Resolution Box */}
      {isConflict && (
        <div className="file-box" style={{ flex: 1, minHeight: '400px' }}>
          <div className="file-box-header" style={{ backgroundColor: 'rgba(248, 81, 73, 0.15)', borderColor: 'rgba(248, 81, 73, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffa198', fontWeight: 600 }}>
              <AlertTriangle size={16} />
              <span>Merge Conflict Detected in Document</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--color-fg-muted)' }}>
              Automatic merge failed. Resolve conflicts before committing.
            </span>
          </div>

          <div className="file-box-body" style={{ overflowY: 'auto' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              {/* Target Branch Version */}
              <div style={{ flex: 1, background: 'var(--color-canvas-inset)', padding: '12px', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-small)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-accent-fg)', marginBottom: '6px' }}>
                  {conflictData.targetBranch} (Current Target)
                </div>
                <pre style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', flex: 1, maxHeight: '240px', overflowY: 'auto', background: 'var(--color-canvas-default)', padding: '8px', borderRadius: '4px' }}>
                  {conflictData.targetContent}
                </pre>
                <button 
                  className="btn btn-sm btn-primary" 
                  style={{ marginTop: '8px' }}
                  onClick={() => onResolveMerge({
                    targetBranch: conflictData.targetBranch,
                    sourceBranch: conflictData.sourceBranch,
                    resolvedContent: conflictData.targetContent,
                    resolutionStrategy: 'keep_target'
                  })}
                >
                  Keep {conflictData.targetBranch}
                </button>
              </div>

              {/* Source Branch Version */}
              <div style={{ flex: 1, background: 'var(--color-canvas-inset)', padding: '12px', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-small)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-purple-fg)', marginBottom: '6px' }}>
                  {conflictData.sourceBranch} (Incoming Branch)
                </div>
                <pre style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', flex: 1, maxHeight: '240px', overflowY: 'auto', background: 'var(--color-canvas-default)', padding: '8px', borderRadius: '4px' }}>
                  {conflictData.sourceContent}
                </pre>
                <button 
                  className="btn btn-sm btn-primary" 
                  style={{ marginTop: '8px' }}
                  onClick={() => onResolveMerge({
                    targetBranch: conflictData.targetBranch,
                    sourceBranch: conflictData.sourceBranch,
                    resolvedContent: conflictData.sourceContent,
                    resolutionStrategy: 'keep_source'
                  })}
                >
                  Keep {conflictData.sourceBranch}
                </button>
              </div>
            </div>

            {/* Manual Resolution Textarea */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Or Resolve Manually:
              </div>
              <textarea
                className="code-editor-textarea"
                style={{ height: '120px', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-small)', marginBottom: '8px' }}
                placeholder="Type resolved content here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
              />
              <button 
                className="btn btn-primary"
                disabled={!manualText.trim()}
                onClick={() => onResolveMerge({
                  targetBranch: conflictData.targetBranch,
                  sourceBranch: conflictData.sourceBranch,
                  resolvedContent: manualText.trim(),
                  resolutionStrategy: 'manual'
                })}
              >
                <ShieldCheck size={14} /> Complete Merge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
