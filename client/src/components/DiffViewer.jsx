import React, { useState } from 'react';
import { GitCompare, Plus, Minus, FileText, CheckCircle2, Columns, RefreshCw } from 'lucide-react';

export default function DiffViewer({
  diffData,
  commits = [],
  branches = [],
  baseCommitId,
  compareCommitId,
  onSelectBaseCommit,
  onSelectCompareCommit,
  isLoading,
  onRefreshDiff
}) {
  const [isSplitView, setIsSplitView] = useState(true);

  if (isLoading) {
    return (
      <div className="editor-area" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--color-fg-muted)' }}>
        <RefreshCw size={24} className="animate-spin text-blue-400" style={{ marginBottom: '12px' }} />
        <span>Computing semantic diff between commits...</span>
      </div>
    );
  }

  if (!diffData) {
    return (
      <div className="editor-area" style={{ justifyContent: 'center', alignItems: 'center', color: 'var(--color-fg-muted)' }}>
        <GitCompare size={32} style={{ marginBottom: '12px', color: 'var(--color-fg-subtle)' }} />
        <span>Select two commits or branches to compare changes.</span>
      </div>
    );
  }

  const summary = diffData.summary || { additions: 0, deletions: 0, modifications: 0, similarityScore: 100, similaritySimilarity: 'Identical' };
  const blocks = diffData.blocks || [];

  return (
    <div className="editor-area">
      {/* 1. Compare Controls Header Bar */}
      <div style={{
        background: 'var(--color-canvas-subtle)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-small)',
        padding: '12px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <GitCompare size={18} style={{ color: 'var(--color-accent-fg)' }} />
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Comparing Changes</span>
          
          {/* Base Commit Dropdown */}
          <select
            className="input-field"
            value={baseCommitId}
            onChange={(e) => onSelectBaseCommit(e.target.value)}
            style={{ width: 'auto', fontSize: '12px' }}
          >
            {commits.map(c => (
              <option key={c._id} value={c._id}>
                base: {c._id.toString().substring(c._id.toString().length - 7)} — {c.message}
              </option>
            ))}
          </select>

          <span style={{ color: 'var(--color-fg-subtle)' }}>←</span>

          {/* Compare Commit Dropdown */}
          <select
            className="input-field"
            value={compareCommitId}
            onChange={(e) => onSelectCompareCommit(e.target.value)}
            style={{ width: 'auto', fontSize: '12px' }}
          >
            {commits.map(c => (
              <option key={c._id} value={c._id}>
                compare: {c._id.toString().substring(c._id.toString().length - 7)} — {c.message}
              </option>
            ))}
          </select>

          <button className="btn btn-sm" onClick={onRefreshDiff}>
            <RefreshCw size={12} />
          </button>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#3fb950', fontWeight: 600 }}>+{summary.additions}</span>
          <span style={{ fontSize: '12px', color: '#f85149', fontWeight: 600 }}>-{summary.deletions}</span>
          <span style={{ fontSize: '11px', background: 'var(--color-accent-subtle)', color: 'var(--color-accent-fg)', padding: '2px 8px', borderRadius: '12px', marginLeft: '6px' }}>
            {summary.similaritySimilarity}
          </span>
          <button className="btn btn-sm" onClick={() => setIsSplitView(!isSplitView)} style={{ marginLeft: '12px' }}>
            <Columns size={13} /> {isSplitView ? 'Split' : 'Unified'}
          </button>
        </div>
      </div>

      {/* 2. GitHub Diff Box */}
      <div className="file-box">
        <div className="file-box-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <FileText size={15} style={{ color: 'var(--color-accent-fg)' }} />
            <span>{diffData.fileName || 'Document'}</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--color-fg-muted)' }}>
            Showing {blocks.length} changed blocks
          </span>
        </div>

        <div className="file-box-body" style={{ padding: 0, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <tbody>
              {blocks.map((block, idx) => {
                if (block.type === 'added') {
                  return (
                    <tr key={idx} className="blob-code-addition">
                      <td style={{ width: '40px', padding: '4px 8px', color: 'var(--color-fg-subtle)', textAlign: 'right', borderRight: '1px solid var(--color-border-default)', userSelect: 'none' }}>+</td>
                      <td style={{ padding: '4px 12px', whiteSpace: 'pre-wrap' }}>{block.text}</td>
                    </tr>
                  );
                }
                if (block.type === 'removed') {
                  return (
                    <tr key={idx} className="blob-code-deletion">
                      <td style={{ width: '40px', padding: '4px 8px', color: 'var(--color-fg-subtle)', textAlign: 'right', borderRight: '1px solid var(--color-border-default)', userSelect: 'none' }}>-</td>
                      <td style={{ padding: '4px 12px', whiteSpace: 'pre-wrap' }}>{block.text}</td>
                    </tr>
                  );
                }
                return (
                  <tr key={idx}>
                    <td style={{ width: '40px', padding: '4px 8px', color: 'var(--color-fg-subtle)', textAlign: 'right', borderRight: '1px solid var(--color-border-default)', userSelect: 'none' }}> </td>
                    <td style={{ padding: '4px 12px', color: 'var(--color-fg-muted)', whiteSpace: 'pre-wrap' }}>{block.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
