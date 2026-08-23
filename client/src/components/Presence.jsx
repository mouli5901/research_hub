import React from 'react';

export default function Presence({ users = [] }) {
  if (!users || users.length === 0) {
    return (
      <div className="presence-bar">
        <span style={{ fontSize: '11px', color: 'var(--text-subtle)' }}>● 1 Active</span>
      </div>
    );
  }

  return (
    <div className="presence-bar">
      <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600 }}>Active Room:</div>
      {users.map((item, idx) => {
        const u = item.user || item;
        const status = item.status || u.status || 'viewing';
        const isEditing = status === 'editing';

        return (
          <div 
            key={item.socketId || u.id || idx} 
            className="presence-pill"
            title={`${u.name || 'Researcher'} (${u.role || 'Collaborator'}) — ${status}`}
          >
            <span 
              className="presence-dot"
              style={{ 
                backgroundColor: isEditing ? '#10b981' : '#3b82f6' 
              }}
            />
            <span style={{ fontWeight: u.isCurrentUser ? 600 : 400, color: u.isCurrentUser ? '#60a5fa' : 'var(--text-muted)' }}>
              {u.name || 'Researcher'}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-subtle)' }}>
              — {status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
