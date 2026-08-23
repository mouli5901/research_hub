import React, { useState } from 'react';
import { X, FileText, MessageSquare, File, FileCode, UploadCloud, CheckCircle, Info, RefreshCw, AlertCircle } from 'lucide-react';

export default function ImportModal({ isOpen, onClose, onImportArtifact }) {
  const [selectedType, setSelectedType] = useState('markdown');
  const [artifactName, setArtifactName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const artifactTypes = [
    {
      id: 'markdown',
      title: 'Markdown / Text',
      formats: '.md, .txt, .tex',
      icon: <FileText size={20} className="text-blue-400" />,
      placeholderName: 'literature_synthesis_notes.md',
      defaultText: '# New Literature Notes\n\n- Key Paper 1: Transformer architecture\n- Key Paper 2: Vector Search'
    },
    {
      id: 'chat',
      title: 'ChatGPT / Claude Export',
      formats: '.json, .md (Conversations)',
      icon: <MessageSquare size={20} className="text-purple-400" />,
      placeholderName: 'gpt4_prompt_history.json',
      defaultText: '[\n  {\n    "sender": "User",\n    "text": "Synthesize RAG benchmark metrics"\n  },\n  {\n    "sender": "Claude",\n    "text": "Dense vector search achieves 91% accuracy"\n  }\n]'
    },
    {
      id: 'pdf',
      title: 'PDF Research Document',
      formats: '.pdf (Text-Extractable Papers)',
      icon: <File size={20} className="text-red-400" />,
      placeholderName: 'arxiv_2401_00000.pdf',
      defaultText: 'PDF Content Ingested: Extraction complete for 12 pages.'
    }
  ];

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!artifactName) {
        setArtifactName(file.name);
      }
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsUploading(true);

    try {
      const currentTypeObj = artifactTypes.find(t => t.id === selectedType);
      const finalName = artifactName.trim() || selectedFile?.name || currentTypeObj.placeholderName;

      let payload = null;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', finalName);
        formData.append('type', selectedType);
        payload = formData;
      } else {
        const finalContent = pastedText.trim() || currentTypeObj.defaultText;
        payload = {
          name: finalName,
          type: selectedType,
          content: finalContent
        };
      }

      await onImportArtifact(payload);

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsUploading(false);
        setSelectedFile(null);
        setPastedText('');
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Ingestion error:', err);
      setErrorMessage(err.message || 'Failed to ingest file.');
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UploadCloud size={20} className="text-blue-400" />
            <span>Ingest Research Artifact</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Info Banner */}
          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            padding: '10px 12px',
            marginBottom: '16px',
            fontSize: '12px',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info size={16} />
            <span>Supported: Markdown/Plaintext, ChatGPT/Claude Exports, and Text-Extractable PDFs.</span>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '10px 12px',
              marginBottom: '16px',
              fontSize: '12px',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Select Artifact Type Grid */}
          <div className="import-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            {artifactTypes.map((type) => (
              <div
                key={type.id}
                className={`import-card ${selectedType === type.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedType(type.id);
                  if (!artifactName && !selectedFile) setArtifactName(type.placeholderName);
                }}
              >
                <div className="import-icon">
                  {type.icon}
                </div>
                <div>
                  <div className="import-title">{type.title}</div>
                  <div className="import-sub">{type.formats}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form Fields */}
          <form onSubmit={handleImport}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500 }}>
                Artifact File Name:
              </label>
              <input
                type="text"
                value={artifactName}
                onChange={(e) => setArtifactName(e.target.value)}
                placeholder={artifactTypes.find(t => t.id === selectedType)?.placeholderName}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none'
                }}
              />
            </div>

            {/* Dropzone File Upload Input */}
            <div className="dropzone" style={{ position: 'relative', cursor: 'pointer' }}>
              <input
                type="file"
                onChange={handleFileChange}
                accept={selectedType === 'pdf' ? '.pdf' : selectedType === 'chat' ? '.json,.md' : '.md,.txt,.tex,.json'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer'
                }}
              />
              <UploadCloud size={28} style={{ margin: '0 auto 8px auto', color: selectedFile ? '#60a5fa' : 'var(--text-subtle)' }} />
              {selectedFile ? (
                <div>
                  <strong style={{ color: '#93c5fd' }}>{selectedFile.name}</strong> ({Math.round(selectedFile.size / 1024)} KB)
                </div>
              ) : (
                <div>
                  <div>Click to choose a file or drag & drop here</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '4px' }}>
                    Formats: {artifactTypes.find(t => t.id === selectedType)?.formats}
                  </div>
                </div>
              )}
            </div>

            {/* Paste Content Option if no file selected */}
            {!selectedFile && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-subtle)', marginBottom: '4px' }}>
                  Or paste raw content directly:
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste Markdown text, LaTeX snippet, or ChatGPT/Claude JSON export..."
                  style={{
                    width: '100%',
                    height: '60px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '8px',
                    color: 'var(--text-main)',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
              </div>
            )}

            <div className="modal-footer" style={{ padding: '16px 0 0 0', borderTop: 'none' }}>
              <button 
                type="button" 
                className="btn btn-default" 
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isUploading || isSuccess}
              >
                {isUploading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Parsing & Normalizing...</span>
                  </>
                ) : isSuccess ? (
                  <>
                    <CheckCircle size={15} />
                    <span>Ingested into Corpus!</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={15} />
                    <span>Ingest Artifact</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
