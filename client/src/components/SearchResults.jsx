import React, { useState, useEffect } from 'react';
import { Search, X, FileText, MessageSquare, File, FileCode, ArrowRight, Filter, RefreshCw } from 'lucide-react';
import { searchArtifactsAPI } from '../services/api';

export default function SearchResults({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('retrieval');
  const [filterType, setFilterType] = useState('all');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const executeSearch = async () => {
      setIsSearching(true);
      try {
        const searchData = await searchArtifactsAPI(query, filterType);
        if (isMounted) {
          setResults(searchData);
        }
      } catch (err) {
        console.error('Error fetching search results:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      executeSearch();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, query, filterType]);

  if (!isOpen) return null;

  const getIcon = (badge) => {
    switch (badge) {
      case 'Chat': return <MessageSquare size={16} className="text-purple-400" />;
      case 'PDF': return <File size={16} className="text-red-400" />;
      case 'Python': return <FileCode size={16} className="text-emerald-400" />;
      default: return <FileText size={16} className="text-blue-400" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content search-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Search Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} className="text-blue-400" />
            <span>Search Research Corpus (Vector & Semantic Index)</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Search Input Box */}
          <div className="search-input-wrapper">
            <Search size={18} style={{ color: 'var(--text-subtle)' }} />
            <input
              type="text"
              className="search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search across documents, chat logs, PDFs, or code history..."
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={12} /> Filter:
            </span>
            {['all', 'markdown', 'chat', 'pdf', 'code'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: filterType === tab ? 'var(--accent-primary)' : 'var(--bg-panel)',
                  color: filterType === tab ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Results List */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Found {results.length} matching semantic artifacts</span>
              {isSearching && <RefreshCw size={12} className="animate-spin text-blue-400" />}
            </div>

            {isSearching && results.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '13px' }}>
                Querying semantic index...
              </div>
            ) : results.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '13px' }}>
                No research records match "{query}"
              </div>
            ) : (
              results.map((result) => (
                <div 
                  key={result.id}
                  className="search-result-item"
                  onClick={() => {
                    onSelectResult(result);
                    onClose();
                  }}
                >
                  <div className="search-result-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getIcon(result.typeBadge)}
                      <span className="search-result-title">{result.title}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '10px', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                        {result.branch}
                      </span>
                      <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                        {result.commitHash}
                      </span>
                      {result.score > 0 && (
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', padding: '2px 6px', borderRadius: '4px' }}>
                          {Math.round(result.score * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>

                  <div 
                    className="search-result-snippet"
                    dangerouslySetInnerHTML={{ __html: result.snippet }}
                  />

                  <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Source: {result.source}</span>
                    <span style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      Open <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
