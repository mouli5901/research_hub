import React, { useState } from 'react';
import { Sparkles, X, Send, GitCommit, FileText, ArrowRight, Bot, RefreshCw, AlertTriangle, Layers } from 'lucide-react';
import { askAIAPI } from '../services/api';

export default function AskAIModal({ isOpen, onClose, onSelectArtifact }) {
  const [question, setQuestion] = useState('What accuracy did our retrieval baseline achieve?');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleAsk = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await askAIAPI(question.trim());
      setResponse(data);
    } catch (err) {
      console.error('Error in Ask AI:', err);
      setErrorMsg(err.message || 'Failed to synthesize answer from research corpus.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} className="text-purple-400" />
            <span style={{ fontWeight: 600 }}>Corpus Q&A — Ask AI (Version-Aware RAG)</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Question Input Form */}
          <form onSubmit={handleAsk} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                className="input-field"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask any question about your research history, chat exports, or papers..."
                style={{ paddingLeft: '36px', fontSize: '13px' }}
                disabled={isLoading}
              />
              <Bot size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-purple)' }} />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !question.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
            >
              {isLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              {isLoading ? 'Synthesizing...' : 'Ask AI'}
            </button>
          </form>

          {/* Quick Preset Queries */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-subtle)', alignSelf: 'center' }}>Presets:</span>
            {[
              "What accuracy did our model achieve?",
              "Explain RAG from our chat exports",
              "What vector search hypothesis was documented?"
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuestion(preset);
                  setIsLoading(true);
                  setErrorMsg(null);
                  askAIAPI(preset)
                    .then(data => setResponse(data))
                    .catch(err => setErrorMsg(err.message))
                    .finally(() => setIsLoading(false));
                }}
                style={{
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#fca5a5',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* AI Response Display */}
          {isLoading ? (
            <div style={{
              padding: '30px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              background: 'var(--bg-panel)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <RefreshCw size={24} className="animate-spin text-purple-400" style={{ margin: '0 auto 12px' }} />
              <div>Querying semantic index & synthesizing version-aware answer...</div>
            </div>
          ) : response ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Answer Card */}
              <div style={{
                background: 'var(--bg-panel)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: '#c084fc', fontSize: '12px', fontWeight: 600 }}>
                  <Sparkles size={14} />
                  <span>Synthesized Answer</span>
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-main)', whitespace: 'pre-line' }}>
                  {response.answer}
                </div>
              </div>

              {/* Provenance Citations Section */}
              {response.provenance && response.provenance.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={13} /> Provenance Citations ({response.provenance.length} Sources Used)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {response.provenance.map((prov, idx) => (
                      <div 
                        key={idx}
                        style={{
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (onSelectArtifact) onSelectArtifact(prov.artifactName);
                          onClose();
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={14} className="text-blue-400" />
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{prov.artifactName}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
                              {prov.branch}
                            </span>
                            <span style={{ fontSize: '10px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <GitCommit size={10} /> {prov.commitHash}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', background: 'var(--bg-app)', padding: '6px 8px', borderRadius: '4px', marginTop: '4px' }}>
                          "{prov.snippet}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
