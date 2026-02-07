import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useNotes } from '../../context/NotesContext'
import { htmlToMarkdown, downloadFile } from '../../utils'
import './ExportMenu.css'

export default function ExportMenu({ noteId, onClose }) {
  const { getNote } = useNotes()
  const [exporting, setExporting] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState(null)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)

  const note = noteId === 'new' ? null : getNote(noteId)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Focus trap and initial focus
  useEffect(() => {
    if (menuRef.current) {
      const firstButton = menuRef.current.querySelector('button')
      firstButton?.focus()
    }
  }, [])

  const exportAsMarkdown = useCallback(() => {
    if (!note) return
    
    setExporting(true)
    
    try {
      const markdown = `# ${note.title || 'Untitled Note'}\n\n${htmlToMarkdown(note.content || '')}`
      downloadFile(markdown, `${note.title || 'untitled'}.md`, 'text/markdown;charset=utf-8')
      
      setExporting(false)
      onClose?.()
    } catch (e) {
      console.error('Export failed:', e)
      setExporting(false)
    }
  }, [note, onClose])

  const exportAsText = useCallback(() => {
    if (!note) return
    
    setExporting(true)
    
    try {
      // Create plain text version
      const div = document.createElement('div')
      div.innerHTML = note.content || ''
      const text = div.textContent || div.innerText || ''
      
      const plainText = `${note.title || 'Untitled Note'}\n\n${text}`
      
      // Download file using utility
      downloadFile(plainText, `${note.title || 'untitled'}.txt`, 'text/plain;charset=utf-8')
      
      setExporting(false)
      onClose?.()
    } catch (e) {
      console.error('Export failed:', e)
      setExporting(false)
    }
  }, [note, onClose])

  const exportAsHTML = useCallback(() => {
    if (!note) return
    
    setExporting(true)
    
    try {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.title || 'Untitled Note'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    img { max-width: 100%; height: auto; }
    pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #007aff; padding-left: 16px; margin: 16px 0; color: #666; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  ${note.content || ''}
</body>
</html>`
      
      // Download file using utility
      downloadFile(html, `${note.title || 'untitled'}.html`, 'text/html;charset=utf-8')
      
      setExporting(false)
      onClose?.()
    } catch (e) {
      console.error('Export failed:', e)
      setExporting(false)
    }
  }, [note, onClose])

  const copyToClipboard = useCallback(async () => {
    if (!note) return
    
    setExporting(true)
    
    try {
      const div = document.createElement('div')
      div.innerHTML = note.content || ''
      const text = div.textContent || div.innerText || ''
      
      await navigator.clipboard.writeText(`${note.title || 'Untitled Note'}\n\n${text}`)
      
      setExporting(false)
      onClose?.()
    } catch (e) {
      console.error('Copy failed:', e)
      setExporting(false)
    }
  }, [note, onClose])

  // Generate share link
  const createShareLink = useCallback(async () => {
    if (!note || !noteId || noteId === 'new') return
    
    setSharing(true)
    setShareUrl(null)
    
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: noteId,
          noteTitle: note.title || 'Untitled Note'
        })
      })
      
      const data = await res.json()
      if (data.success && data.data) {
        const shareUrl = `${window.location.origin}/share/${data.data.noteId}/${data.data.token}`
        setShareUrl(shareUrl)
      } else {
        console.error('Failed to create share link:', data.error)
      }
    } catch (error) {
      console.error('Share error:', error)
    } finally {
      setSharing(false)
    }
  }, [note, noteId])

  // Copy share link to clipboard
  const copyShareLink = useCallback(() => {
    if (!shareUrl) return
    
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [shareUrl])

  // Close share URL display
  const closeShareUrl = useCallback(() => {
    setShareUrl(null)
  }, [])

  // Revoke share link
  const revokeShareLink = useCallback(async () => {
    if (!noteId || noteId === 'new') return
    
    if (!confirm('Are you sure you want to revoke this share link? Anyone with the link will no longer be able to view this note.')) {
      return
    }
    
    try {
      const res = await fetch(`/api/share?noteId=${noteId}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      if (data.success) {
        setShareUrl(null)
        alert('Share link revoked successfully!')
      } else {
        console.error('Failed to revoke share:', data.error)
        alert('Failed to revoke share link')
      }
    } catch (error) {
      console.error('Revoke error:', error)
      alert('Failed to revoke share link')
    }
  }, [noteId])

  return (
    <div className="export-menu" ref={menuRef} role="dialog" aria-modal="true" aria-labelledby="export-title">
      <div className="export-menu-header">
        <h3 id="export-title">Export Note</h3>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      
      <div className="export-options">
        <button 
          className="export-option"
          onClick={exportAsMarkdown}
          disabled={exporting}
        >
          <div className="export-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className="export-info">
            <span className="export-title">Markdown</span>
            <span className="export-desc">.md file for notes apps</span>
          </div>
        </button>

        <button 
          className="export-option"
          onClick={exportAsText}
          disabled={exporting}
        >
          <div className="export-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="17" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
          </div>
          <div className="export-info">
            <span className="export-title">Plain Text</span>
            <span className="export-desc">.txt file for any editor</span>
          </div>
        </button>

        <button 
          className="export-option"
          onClick={exportAsHTML}
          disabled={exporting}
        >
          <div className="export-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div className="export-info">
            <span className="export-title">HTML</span>
            <span className="export-desc">.html file for browsers</span>
          </div>
        </button>

        <button 
          className="export-option"
          onClick={copyToClipboard}
          disabled={exporting}
        >
          <div className="export-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </div>
          <div className="export-info">
            <span className="export-title">Copy to Clipboard</span>
            <span className="export-desc">Paste anywhere</span>
          </div>
        </button>

        {/* Share Button */}
        {shareUrl ? (
          <div className="share-url-container">
            <div className="share-url-box">
              <input 
                type="text" 
                className="share-url-input"
                value={shareUrl}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button 
                className="share-url-copy-btn"
                onClick={copyShareLink}
              >
                {copied ? '✓' : 'Copy'}
              </button>
              <button 
                className="share-url-close-btn"
                onClick={closeShareUrl}
              >
                ×
              </button>
            </div>
            <p className="share-url-hint">Anyone with this link can view this note</p>
            <button 
              className="share-revoke-btn"
              onClick={revokeShareLink}
            >
              🔒 Revoke Link
            </button>
          </div>
        ) : (
          <button 
            className="export-option share-option"
            onClick={createShareLink}
            disabled={sharing || !noteId || noteId === 'new'}
          >
            <div className="export-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </div>
            <div className="export-info">
              <span className="export-title">Share Link</span>
              <span className="export-desc">{sharing ? 'Generating...' : 'Create read-only link'}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
