import React, { useCallback, useState } from 'react'
import { useNotes } from '../../context/NotesContext'
import './ExportMenu.css'

export default function ExportMenu({ noteId, onClose }) {
  const { getNote } = useNotes()
  const [exporting, setExporting] = useState(false)

  const note = noteId === 'new' ? null : getNote(noteId)

  const exportAsMarkdown = useCallback(() => {
    if (!note) return
    
    setExporting(true)
    
    try {
      // Convert HTML to Markdown
      let content = note.content || ''
      
      // Basic HTML to Markdown conversion
      content = content
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<u[^>]*>(.*?)<\/u>/gi, '<u>$1</u>')
        .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
        .replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~~$1~~')
        .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
        .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
        .replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
        .replace(/<hr\s*\/?>/gi, '\n---\n')
        .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n{3,}/g, '\n\n') // Remove extra newlines
        .trim()

      const markdown = `# ${note.title || 'Untitled Note'}\n\n${content}`
      
      // Create and download file
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${note.title || 'untitled'}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
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
      
      // Create and download file
      const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${note.title || 'untitled'}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
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
      
      // Create and download file
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${note.title || 'untitled'}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
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

  return (
    <div className="export-menu">
      <div className="export-menu-header">
        <h3>Export Note</h3>
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
      </div>
    </div>
  )
}
