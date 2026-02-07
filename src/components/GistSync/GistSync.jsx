import React, { useState, useEffect, useCallback } from 'react';
import { gistStorage } from '../../lib/gistStorage';
import './GistSync.css';

export default function GistSync({ notes, onNotesLoaded, onSync }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [config, setConfig] = useState({
    gistId: '',
    token: ''
  });
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('read'); // 'read' or 'write'

  useEffect(() => {
    const savedId = localStorage.getItem('gist_id');
    const savedToken = localStorage.getItem('gist_token');
    const envGistId = (typeof importMeta !== 'undefined' && importMeta?.env?.VITE_GIST_ID) || '';
    const envToken = (typeof importMeta !== 'undefined' && importMeta?.env?.VITE_GIST_TOKEN) || '';
    const gistId = savedId || envGistId || '';
    const token = savedToken || envToken || '';

    if (gistId) {
      gistStorage.configure(gistId, token || null);
    }

    setConfig({ gistId, token });
    setIsConfigured(!!gistId);
  }, []);

  const loadNotes = useCallback(async () => {
    setIsSyncing(true);
    setStatus({ type: 'info', message: 'Loading notes...' });
    
    const result = await gistStorage.fetchNotes();
    
    if (result.success) {
      if (result.data && result.data.length > 0) {
        onNotesLoaded?.(result.data);
        setStatus({ 
          type: 'success', 
          message: result.fallback
            ? `Loaded ${result.data.length} notes (local cache)` 
            : `Loaded ${result.data.length} notes` 
        });
      } else {
        setStatus({ 
          type: 'success', 
          message: result.fallback ? 'Local cache is empty' : 'Gist is empty' 
        });
      }
    } else {
      setStatus({ type: 'error', message: result.error });
    }
    
    setIsSyncing(false);
  }, [onNotesLoaded]);

  const saveNotes = useCallback(async () => {
    if (!notes || !Array.isArray(notes)) {
      setStatus({ type: 'error', message: 'No notes to save' });
      return;
    }
    
    if (!config.token) {
      setStatus({ type: 'error', message: 'Token required for saving' });
      setMode('write');
      return;
    }

    setIsSyncing(true);
    setStatus({ type: 'info', message: 'Saving notes...' });
    
    const result = await gistStorage.saveNotes(notes);
    
    if (result.success) {
      if (result.fallback) {
        setStatus({ type: 'success', message: `Saved ${notes.length} notes (local cache)` });
      } else {
        setStatus({ type: 'success', message: `Saved ${notes.length} notes` });
        onSync?.();
      }
    } else {
      setStatus({ type: 'error', message: result.error });
    }
    
    setIsSyncing(false);
  }, [notes, config.token, onSync]);

  const handleCreateGist = useCallback(async () => {
    if (!config.token) {
      setStatus({ type: 'error', message: 'Token required to create Gist' });
      return;
    }

    setIsSyncing(true);
    setStatus({ type: 'info', message: 'Creating Gist...' });
    
    const result = await gistStorage.createGist(config.token);
    
    if (result.success) {
      setConfig(prev => ({ ...prev, gistId: result.gistId }));
      gistStorage.configure(result.gistId, config.token);
      setIsConfigured(true);
      setStatus({ type: 'success', message: `Created! ID: ${result.gistId}` });
    } else {
      setStatus({ type: 'error', message: result.error });
    }
    
    setIsSyncing(false);
  }, [config.token]);

  const handleSaveConfig = useCallback(() => {
    gistStorage.configure(config.gistId, config.token || null);
    setIsConfigured(true);
    setStatus({ type: 'success', message: 'Settings saved' });
    loadNotes();
  }, [config, loadNotes]);

  const handleDisconnect = useCallback(() => {
    gistStorage.clearConfig();
    setIsConfigured(false);
    setStatus(null);
  }, []);

  return (
    <>
      <button
        className={`gist-sync-btn ${isConfigured ? 'configured' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Cloud Sync"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {isConfigured && <span className="sync-indicator" />}
      </button>

      {isOpen && (
        <div className="gist-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="gist-modal" onClick={e => e.stopPropagation()}>
            <div className="gist-modal-header">
              <h3>☁️ Cloud Sync</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="gist-modal-content">
              <div className="mode-toggle">
                <button 
                  className={mode === 'read' ? 'active' : ''}
                  onClick={() => setMode('read')}
                >
                  📖 Read Only
                </button>
                <button 
                  className={mode === 'write' ? 'active' : ''}
                  onClick={() => setMode('write')}
                >
                  ✏️ Read & Write
                </button>
              </div>

              {mode === 'read' && (
                <div className="setup-section">
                  <p className="help-text">
                    Enter a Gist ID to sync notes across devices. 
                    <br />
                    <strong>No account needed to read!</strong>
                  </p>
                  
                  <div className="form-group">
                    <label>Gist ID</label>
                    <input
                      type="text"
                      value={config.gistId}
                      onChange={e => setConfig({...config, gistId: e.target.value})}
                      placeholder="a1b2c3d4e5f6..."
                    />
                    <small>
                      Create at: gist.github.com → New Secret Gist → Copy ID from URL
                    </small>
                  </div>

                  <button 
                    className="btn-primary"
                    onClick={handleSaveConfig}
                    disabled={!config.gistId}
                  >
                    Connect
                  </button>
                </div>
              )}

              {mode === 'write' && (
                <div className="setup-section">
                  <p className="help-text">
                    Enter your Gist ID and Token to save notes.
                  </p>

                  <div className="form-group">
                    <label>Gist ID</label>
                    <input
                      type="text"
                      value={config.gistId}
                      onChange={e => setConfig({...config, gistId: e.target.value})}
                      placeholder="a1b2c3d4e5f6..."
                    />
                  </div>

                  <div className="form-group">
                    <label>GitHub Token</label>
                    <input
                      type="password"
                      value={config.token}
                      onChange={e => setConfig({...config, token: e.target.value})}
                      placeholder="ghp_xxxxxxxxxxxx"
                    />
                    <small>
                      Create at: github.com/settings/tokens → Generate new token → gist scope
                    </small>
                  </div>

                  <div className="button-group">
                    <button 
                      className="btn-secondary"
                      onClick={handleCreateGist}
                      disabled={!config.token || isSyncing}
                    >
                      🆕 Create New Gist
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleSaveConfig}
                      disabled={!config.gistId}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {isConfigured && (
                <div className="connected-section">
                  <div className="connection-status">
                    <span className="status-dot" />
                    Connected to Gist
                  </div>
                  
                  <div className="sync-actions">
                    <button 
                      className="btn-primary"
                      onClick={loadNotes}
                      disabled={isSyncing}
                    >
                      {isSyncing ? 'Loading...' : '📥 Load Notes'}
                    </button>
                    
                    <button 
                      className="btn-primary"
                      onClick={saveNotes}
                      disabled={isSyncing || !config.token}
                    >
                      {isSyncing ? 'Saving...' : '💾 Save Notes'}
                    </button>
                  </div>

                  <button 
                    className="btn-text"
                    onClick={handleDisconnect}
                  >
                    Disconnect
                  </button>
                </div>
              )}

              {status && (
                <div className={`status-message ${status.type}`}>
                  {status.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
