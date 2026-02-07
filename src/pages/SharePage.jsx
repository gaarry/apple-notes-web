import React, { useEffect, useState } from 'react'

// Share page styles
const shareStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    background: #fff;
    color: #000;
    min-height: 100vh;
  }
  
  html.dark {
    background: #000;
    color: #fff;
  }
  
  .share-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 48px 24px;
  }
  
  .share-header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .share-note-title {
    font-size: 32px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  
  .share-meta {
    font-size: 14px;
    color: #8e8e93;
  }
  
  .share-content {
    background: #f2f2f7;
    border-radius: 12px;
    padding: 32px;
    line-height: 1.7;
  }
  
  html.dark .share-content {
    background: #1c1c1e;
  }
  
  .share-content h1 {
    font-size: 28px;
    margin: 24px 0 16px;
  }
  
  .share-content h2 {
    font-size: 22px;
    margin: 20px 0 12px;
  }
  
  .share-content h3 {
    font-size: 18px;
    margin: 16px 0 8px;
  }
  
  .share-content p {
    margin: 12px 0;
  }
  
  .share-content ul, .share-content ol {
    padding-left: 24px;
    margin: 12px 0;
  }
  
  .share-content blockquote {
    border-left: 4px solid #007aff;
    padding-left: 16px;
    margin: 16px 0;
    color: #8e8e93;
    font-style: italic;
  }
  
  .share-content code {
    background: rgba(0, 0, 0, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 14px;
  }
  
  html.dark .share-content code {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .share-content pre {
    background: rgba(0, 0, 0, 0.05);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 16px 0;
  }
  
  html.dark .share-content pre {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .share-content pre code {
    background: none;
    padding: 0;
  }
  
  .share-content img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 16px 0;
  }
  
  .share-content hr {
    border: none;
    border-top: 1px solid #e5e5e5;
    margin: 24px 0;
  }
  
  html.dark .share-content hr {
    border-color: #38383a;
  }
  
  .share-error {
    text-align: center;
    padding: 80px 24px;
  }
  
  .share-error h1 {
    font-size: 24px;
    margin-bottom: 16px;
  }
  
  .share-error p {
    color: #8e8e93;
    margin-bottom: 24px;
  }
  
  .share-loading {
    text-align: center;
    padding: 80px 24px;
  }
  
  .share-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f2f2f7;
    border-top-color: #007aff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 16px;
  }
  
  html.dark .share-loading-spinner {
    border-color: #1c1c1e;
    border-top-color: #007aff;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .share-footer {
    text-align: center;
    margin-top: 48px;
    padding-top: 24px;
    border-top: 1px solid #e5e5e5;
    color: #8e8e93;
    font-size: 13px;
  }
  
  html.dark .share-footer {
    border-color: #38383a;
  }
  
  @media (max-width: 768px) {
    .share-container {
      padding: 24px 16px;
    }
    
    .share-note-title {
      font-size: 24px;
    }
    
    .share-content {
      padding: 20px;
    }
    
    .share-content h1 {
      font-size: 24px;
    }
    
    .share-content h2 {
      font-size: 20px;
    }
  }
`

export default function SharePage({ noteId, shareToken }) {
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const validateAndFetch = async () => {
      if (!noteId || !shareToken) {
        setError('Invalid share link')
        setLoading(false)
        return
      }

      try {
        // Validate token first
        const validateRes = await fetch(`/api/share?token=${shareToken}`)
        const validateData = await validateRes.json()

        if (!validateData.valid) {
          setError(validateData.error || 'This share link is invalid or has been revoked')
          setLoading(false)
          return
        }

        // Get gistId from localStorage (set when user configured cloud sync)
        const gistId = localStorage.getItem('gist_id')
        
        if (!gistId) {
          // No gist configured - show title only, content not available
          setNote({
            id: validateData.noteId,
            title: validateData.noteTitle,
            content: '<p>📝 Note content is not available.</p><p><strong>To share notes with full content, please:</strong></p><ol><li>Open Apple Notes Web</li><li>Configure Cloud Sync with a GitHub Gist</li><li>Create the share link again</li></ol>',
            updatedAt: null
          })
          setLoading(false)
          return
        }
        
        // Fetch notes from gist
        const gistRes = await fetch(`/api/gist?gistId=${gistId}`)
        const gistData = await gistRes.json()

        if (gistData.success && gistData.data) {
          // Find the specific note by ID
          const sharedNote = gistData.data.find(n => n.id === validateData.noteId)
          
          if (sharedNote) {
            setNote({
              id: sharedNote.id,
              title: sharedNote.title || validateData.noteTitle,
              content: sharedNote.content || '<p>No content</p>',
              updatedAt: sharedNote.updatedAt
            })
          } else {
            // Note not found in gist, show title from token
            setNote({
              id: validateData.noteId,
              title: validateData.noteTitle,
              content: '<p>This note may have been deleted from the original source.</p>',
              updatedAt: null
            })
          }
        } else {
          // Couldn't fetch notes, show title from token
          setNote({
            id: validateData.noteId,
            title: validateData.noteTitle,
            content: '<p>Unable to load note content. Please check the original source.</p>',
            updatedAt: null
          })
        }
      } catch (err) {
        console.error('Failed to load shared note:', err)
        setError('Failed to load shared note')
      } finally {
        setLoading(false)
      }
    }

    validateAndFetch()
  }, [noteId, shareToken])

  if (loading) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: shareStyles }} />
        <div className="share-container">
          <div className="share-loading">
            <div className="share-loading-spinner" />
            <p>Loading shared note...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: shareStyles }} />
        <div className="share-container">
          <div className="share-error">
            <h1>🔒 Link Invalid</h1>
            <p>{error}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: shareStyles }} />
      <div className="share-container">
        <header className="share-header">
          <h1 className="share-note-title">{note?.title || 'Untitled Note'}</h1>
          <p className="share-meta">Shared via Apple Notes Web</p>
        </header>

        <article 
          className="share-content"
          dangerouslySetInnerHTML={{ __html: note?.content || '' }}
        />

        <footer className="share-footer">
          <p>Created with Apple Notes Web</p>
        </footer>
      </div>
    </>
  )
}
