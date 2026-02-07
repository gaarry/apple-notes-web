import React, { useState, useEffect, useCallback } from 'react'
import { githubStorage } from '../../lib/githubStorage'
import './GitHubSync.css'

export default function GitHubSync({ notes, onSyncComplete }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [config, setConfig] = useState({
    token: '',
    owner: '',
    repo: 'my-notes',
    isPrivate: true
  })
  const [status, setStatus] = useState(null)
  const [lastSync, setLastSync] = useState(localStorage.getItem('github_last_sync'))

  useEffect(() => {
    setIsConfigured(githubStorage.isConfigured())
    
    // Load saved config (except token)
    const savedOwner = localStorage.getItem('github_owner')
    const savedRepo = localStorage.getItem('github_repo')
    
    if (savedOwner) {
      setConfig(prev => ({
        ...prev,
        owner: savedOwner,
        repo: savedRepo || 'my-notes'
      }))
    }
  }, [])

  const handleConfig = useCallback(async (e) => {
    e.preventDefault()
    
    githubStorage.configure(
      config.token,
      config.owner,
      config.repo
    )
    
    setStatus({ type: 'info', message: 'Initializing repository...' })
    
    const result = await githubStorage.initRepo(config.isPrivate)
    
    if (result.success) {
      setIsConfigured(true)
      setStatus({ type: 'success', message: 'Connected to GitHub!' })
      
      // Clear token from form
      setConfig(prev => ({ ...prev, token: '' }))
    } else {
      setStatus({ type: 'error', message: result.error })
    }
  }, [config])

  const handleSync = useCallback(async () => {
    if (!isConfigured || isSyncing) return
    
    setIsSyncing(true)
    setStatus({ type: 'info', message: 'Syncing to GitHub...' })
    
    try {
      let uploaded = 0
      
      for (const note of notes) {
        const result = await githubStorage.saveNote(note)
        if (result.success) uploaded++
      }
      
      const now = new Date().toISOString()
      localStorage.setItem('github_last_sync', now)
      setLastSync(now)
      
      setStatus({ type: 'success', message: `Synced ${uploaded} notes!` })
      onSyncComplete?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSyncing(false)
    }
  }, [isConfigured, isSyncing, notes, onSyncComplete])

  const handleDisconnect = useCallback(() => {
    githubStorage.clearConfig()
    setIsConfigured(false)
    setStatus(null)
    setLastSync(null)
  }, [])

  const formatLastSync = (date) => {
    if (!date) return 'Never'
    const d = new Date(date)
    return d.toLocaleString()
  }

  return (
    <>
      {/* Sync Button in Header */}
      <button
        className={`github-sync-btn ${isConfigured ? 'configured' : ''}`}
        onClick={() => setIsOpen(true)}
        title="GitHub Sync"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        {isConfigured && <span className="sync-indicator" />}
      </button>

      {/* Settings Modal */}
      {isOpen && (
        <div className="github-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="github-modal" onClick={e => e.stopPropagation()}>
            <div className="github-modal-header">
              <h3>GitHub Sync</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="github-modal-content">
              {!isConfigured ? (
                <form onSubmit={handleConfig}>
                  <div className="form-group">
                    <label>GitHub Personal Access Token</label>
                    <input
                      type="password"
                      value={config.token}
                      onChange={e => setConfig({...config, token: e.target.value})}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      required
                    />
                    <small>
                      Create at: Settings → Developer settings → Personal access tokens → Tokens (classic)
                      <br />
                      Required scopes: <code>repo</code>
                    </small>
                  </div>

                  <div className="form-group">
                    <label>GitHub Username</label>
                    <input
                      type="text"
                      value={config.owner}
                      onChange={e => setConfig({...config, owner: e.target.value})}
                      placeholder="your-username"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Repository Name</label>
                    <input
                      type="text"
                      value={config.repo}
                      onChange={e => setConfig({...config, repo: e.target.value})}
                      placeholder="my-notes"
                    />
                  </div>

                  <div className="form-group checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={config.isPrivate}
                        onChange={e => setConfig({...config, isPrivate: e.target.checked})}
                      />
                      Private Repository
                    </label>
                  </div>

                  <button type="submit" className="btn-primary">
                    Connect to GitHub
                  </button>
                </form>
              ) : (
                <div className="sync-status">
                  <div className="status-item">
                    <span className="status-label">Status:</span>
                    <span className="status-value connected">Connected</span>
                  </div>
                  
                  <div className="status-item">
                    <span className="status-label">Repository:</span>
                    <span className="status-value">
                      {localStorage.getItem('github_owner')}/{localStorage.getItem('github_repo')}
                    </span>
                  </div>
                  
                  <div className="status-item">
                    <span className="status-label">Last Sync:</span>
                    <span className="status-value">{formatLastSync(lastSync)}</span>
                  </div>

                  <div className="status-item">
                    <span className="status-label">Notes:</span>
                    <span className="status-value">{notes.length} notes</span>
                  </div>

                  <div className="sync-actions">
                    <button 
                      className="btn-primary"
                      onClick={handleSync}
                      disabled={isSyncing}
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    
                    <button 
                      className="btn-secondary"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </button>
                  </div>
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
  )
}
