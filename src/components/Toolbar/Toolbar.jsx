import React, { useCallback } from 'react'
import './Toolbar.css'

export default function Toolbar({ editor }) {
  if (!editor) {
    return null
  }

  const toggleBold = useCallback(() => {
    editor.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleStrike = useCallback(() => {
    editor.chain().focus().toggleStrike().run()
  }, [editor])

  const toggleCode = useCallback(() => {
    editor.chain().focus().toggleCode().run()
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor.chain().focus().toggleBulletList().run()
  }, [editor])

  const toggleOrderedList = useCallback(() => {
    editor.chain().focus().toggleOrderedList().run()
  }, [editor])

  const toggleBlockquote = useCallback(() => {
    editor.chain().focus().toggleBlockquote().run()
  }, [editor])

  const toggleHeading1 = useCallback(() => {
    editor.chain().focus().toggleHeading({ level: 1 }).run()
  }, [editor])

  const toggleHeading2 = useCallback(() => {
    editor.chain().focus().toggleHeading({ level: 2 }).run()
  }, [editor])

  const setHorizontalRule = useCallback(() => {
    editor.chain().focus().setHorizontalRule().run()
  }, [editor])

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('Enter URL:', previousUrl)
    if (url === null) {
      return
    }
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const handleUndo = useCallback(() => {
    editor.chain().focus().undo().run()
  }, [editor])

  const handleRedo = useCallback(() => {
    editor.chain().focus().redo().run()
  }, [editor])

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting options">
      <div className="toolbar-group">
        <button
          type="button"
          className="toolbar-btn"
          onClick={handleUndo}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10h10a5 5 0 0 1 5 5v2" />
            <polyline points="3 6 7 10 3 14" />
          </svg>
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={handleRedo}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10H11a5 5 0 0 0-5 5v2" />
            <polyline points="21 6 17 10 21 14" />
          </svg>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={toggleBold}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          aria-pressed={editor.isActive('bold')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>

        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={toggleItalic}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          aria-pressed={editor.isActive('italic')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
          </svg>
        </button>

        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
          onClick={toggleStrike}
          title="Strikethrough"
          aria-label="Strikethrough"
          aria-pressed={editor.isActive('strike')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <path d="M16 6C16 6 14.5 4 12 4C9.5 4 8 6 8 8c0 1.5 1 2.5 2 3" />
            <path d="M8 18c0 0 1.5 2 4 2s4-2 4-4c0-1.5-1-2.5-2-3" />
          </svg>
        </button>

        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('code') ? 'active' : ''}`}
          onClick={toggleCode}
          title="Inline Code"
          aria-label="Inline Code"
          aria-pressed={editor.isActive('code')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          onClick={toggleHeading1}
          title="Heading 1"
          aria-label="Heading 1"
          aria-pressed={editor.isActive('heading', { level: 1 })}
        >
          H1
        </button>

        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          onClick={toggleHeading2}
          title="Heading 2"
          aria-label="Heading 2"
          aria-pressed={editor.isActive('heading', { level: 2 })}
        >
          H2
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          onClick={toggleBulletList}
          title="Bullet List"
          aria-label="Bullet List"
          aria-pressed={editor.isActive('bulletList')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="4" cy="12" r="1" fill="currentColor" />
            <circle cx="4" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>

        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          onClick={toggleOrderedList}
          title="Numbered List"
          aria-label="Numbered List"
          aria-pressed={editor.isActive('orderedList')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="4" y="8" fontSize="8" fill="currentColor" stroke="none">1</text>
            <text x="4" y="14" fontSize="8" fill="currentColor" stroke="none">2</text>
            <text x="4" y="20" fontSize="8" fill="currentColor" stroke="none">3</text>
          </svg>
        </button>

        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          onClick={toggleBlockquote}
          title="Quote"
          aria-label="Quote"
          aria-pressed={editor.isActive('blockquote')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21c0 1 0 1 1 1z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        </button>
      </div>

      <div className="toolbar-divider" />

      <div className="toolbar-group">
        <button
          type="button"
          className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
          onClick={addLink}
          title="Add Link"
          aria-label="Add Link"
          aria-pressed={editor.isActive('link')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={addImage}
          title="Add Image"
          aria-label="Add Image"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        <button
          type="button"
          className="toolbar-btn"
          onClick={setHorizontalRule}
          title="Divider"
          aria-label="Horizontal Divider"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
