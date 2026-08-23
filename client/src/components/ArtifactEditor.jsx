import React, { useState } from 'react';
import { FileText, GitCommit, Eye, Edit3, Save, Check } from 'lucide-react';

export default function ArtifactEditor({ activeArtifact, activeCommit, onUpdateContent, currentBranch, onSaveCommit }) {
  const [isEditing, setIsEditing] = useState(false);

  const content = activeCommit?.content || '';
  const linesCount = content ? content.split('\n').length : 0;
  const bytesCount = new Blob([content]).size;

  const shortCommitHash = activeCommit?._id 
    ? activeCommit._id.toString().substring(activeCommit._id.toString().length - 7)
    : 'head';

  return (
    <div className="editor-area">
      <div className="file-box">
        {/* GitHub File View Header */}
        <div className="file-box-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-fg-default)' }}>
              <FileText size={15} className="text-blue-400" />
              <span>{activeArtifact?.name || 'Document'}</span>
            </div>

            <span style={{ fontSize: '11px', color: 'var(--color-fg-subtle)' }}>
              {linesCount} lines ({bytesCount} bytes)
            </span>

            {activeCommit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: 'var(--color-canvas-inset)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border-default)' }}>
                <GitCommit size={12} style={{ color: 'var(--color-accent-fg)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent-fg)' }}>{shortCommitHash}</span>
                <span style={{ color: 'var(--color-fg-muted)', marginLeft: '4px' }}>{activeCommit.message}</span>
              </div>
            )}
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              className={`btn btn-sm ${!isEditing ? 'btn-primary' : ''}`}
              onClick={() => setIsEditing(false)}
            >
              <Eye size={13} /> Preview
            </button>
            <button 
              className={`btn btn-sm ${isEditing ? 'btn-primary' : ''}`}
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={13} /> Edit
            </button>
            {isEditing && (
              <button className="btn btn-primary btn-sm" onClick={onSaveCommit}>
                <Save size={13} /> Commit Changes...
              </button>
            )}
          </div>
        </div>

        {/* File Body Panel */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          {isEditing ? (
            <textarea
              className="code-editor-textarea"
              value={content}
              onChange={(e) => onUpdateContent(e.target.value)}
              placeholder="Edit document research content..."
            />
          ) : (
            <div className="file-box-body">
              <div className="markdown-body">
                {content.split('\n').map((line, idx) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={idx}>{line.replace('# ', '')}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={idx}>{line.replace('## ', '')}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={idx}>{line.replace('### ', '')}</h3>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={idx} style={{ marginLeft: '20px' }}>{line.replace('- ', '')}</li>;
                  }
                  return <p key={idx} style={{ marginBottom: '8px' }}>{line}</p>;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
