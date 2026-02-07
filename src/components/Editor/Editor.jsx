import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useNotes } from '../../context/NotesContext'
import { formatLongDate, countWords } from '../../utils'
import Toolbar from '../Toolbar/Toolbar'
import './Editor.css'

export default function Editor({ noteId, onDeleteNote, deleteMode, onExport, isMobile, onNoteCreated }) {
  const { notes, createNote, updateNote, getNote, deleteNote, loading } = useNotes()
  const [createdNoteId, setCreatedNoteId] = useState(null)
  const [localTitle, setLocalTitle] = useState('') // Local state for new note title
  const [localContent, setLocalContent] = useState('') // Local state for new note content
  const [saveStatus, setSaveStatus] = useState('saved') // 'saved', 'saving', 'unsaved'
  const [wordCount, setWordCount] = useState(0)
  const saveTimeoutRef = useRef(null)

  // Use createdNoteId for new notes after creation
  const effectiveNoteId = createdNoteId || noteId
  const note = noteId === 'new' ? null : getNote(noteId)
  
  // Get effective note after creation
  const effectiveNote = effectiveNoteId && effectiveNoteId !== 'new' ? getNote(effectiveNoteId) : null

  // Reset local state when switching notes
  useEffect(() => {
    if (noteId === 'new') {
      setCreatedNoteId(null)
      setLocalTitle('')
      setLocalContent('')
    }
  }, [noteId])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing...'
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link'
        }
      })
    ],
    content: note?.content || localContent || '',
    editorProps: {
      attributes: {
        class: 'editor-content',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Note content'
      }
    },
    onUpdate: ({ editor }) => {
      // Update word count using utility
      setWordCount(countWords(editor.getText()))
      
      // Set unsaved status
      setSaveStatus('unsaved')
      
      // Auto-save after 1 second of inactivity (longer on mobile for better UX)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      
      const saveDelay = isMobile ? 1500 : 1000 // Longer delay on mobile
      
      saveTimeoutRef.current = setTimeout(() => {
        if (noteId === 'new') {
          // Create note only once, then update the created note
          if (!createdNoteId) {
            const newId = createNote()
            setCreatedNoteId(newId)
            updateNote(newId, { content: editor.getHTML() })
            onNoteCreated?.(newId)
          } else {
            updateNote(createdNoteId, { content: editor.getHTML() })
          }
        } else {
          updateNote(noteId, { content: editor.getHTML() })
        }
        setSaveStatus('saved')
      }, saveDelay)
    }
  })

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!editor) return
      
      // Ctrl+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        editor.chain().focus().undo().run()
      }
      
      // Ctrl+Shift+Z or Ctrl+Y - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        editor.chain().focus().redo().run()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  useEffect(() => {
    if (editor && note?.content !== undefined) {
      const currentContent = editor.getHTML()
      if (currentContent !== note.content) {
        editor.commands.setContent(note.content || '', false) // false = don't emit update
      }
      // Update word count when switching notes
      setWordCount(countWords(editor.getText()))
    }
  }, [noteId, editor, note?.content])

  const handleTitleChange = useCallback((e) => {
    const title = e.target.value
    
    // Update local state for new notes
    if (noteId === 'new' && !createdNoteId) {
      setLocalTitle(title)
    }
    
    setSaveStatus('unsaved')
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    const saveDelay = isMobile ? 1500 : 1000
    
    saveTimeoutRef.current = setTimeout(() => {
      if (noteId === 'new') {
        // Create note only once, then update the created note
        if (!createdNoteId) {
          const newId = createNote()
          setCreatedNoteId(newId)
          updateNote(newId, { title })
          onNoteCreated?.(newId)
        } else {
          updateNote(createdNoteId, { title })
        }
      } else {
        updateNote(noteId, { title })
      }
      setSaveStatus('saved')
    }, saveDelay)
  }, [noteId, createNote, updateNote, isMobile, createdNoteId, onNoteCreated])

  const handleDelete = useCallback(() => {
    const targetId = createdNoteId || noteId
    if (targetId && targetId !== 'new') {
      deleteNote(targetId)
      onDeleteNote(targetId)
      setCreatedNoteId(null)
    }
  }, [noteId, createdNoteId, onDeleteNote])

  // Memoized formatted date
  const formattedDate = useMemo(() => 
    formatLongDate(note?.updatedAt),
    [note?.updatedAt]
  )

  const handleUndo = useCallback(() => {
    if (editor) {
      editor.chain().focus().undo().run()
    }
  }, [editor])

  const handleRedo = useCallback(() => {
    if (editor) {
      editor.chain().focus().redo().run()
    }
  }, [editor])

  // Show welcome screen if no note is selected
  if (!noteId) {
    return (
      <main className="main-content welcome-state" role="main">
        <div className="welcome-screen">
          <div className="welcome-content">
            <svg className="welcome-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h1>Notes</h1>
            <p>Create a new note to get started</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="main-content" role="main" aria-label="Main content area">
      <div className="editor-container">
        <div className="editor-header">
          <div className="editor-info">
            <span className={`save-status ${saveStatus}`}>
              {saveStatus === 'saved' && '✓ Saved'}
              {saveStatus === 'saving' && '💾 Saving...'}
              {saveStatus === 'unsaved' && '● Unsaved'}
            </span>
            <span className="note-date">
              {formattedDate}
            </span>
            <span className="word-count">
              {wordCount} words
            </span>
          </div>
          <div className="editor-actions">
            <button
              className="action-btn"
              onClick={handleUndo}
              disabled={!editor?.can().undo()}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 10h10a5 5 0 0 1 5 5v2" />
                <polyline points="3 6 7 10 3 14" />
              </svg>
            </button>
            <button
              className="action-btn"
              onClick={handleRedo}
              disabled={!editor?.can().redo()}
              title="Redo (Ctrl+Y)"
              aria-label="Redo"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10H11a5 5 0 0 0-5 5v2" />
                <polyline points="21 6 17 10 21 14" />
              </svg>
            </button>
            <button
              className="action-btn"
              onClick={onExport}
              disabled={!noteId || noteId === 'new'}
              title="Export (Ctrl+E)"
              aria-label="Export note"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            {deleteMode && (
              <button 
                className="delete-confirm-btn"
                onClick={handleDelete}
              >
                Delete Note
              </button>
            )}
          </div>
        </div>

        <Toolbar editor={editor} />

        <input
          type="text"
          className="editor-title"
          placeholder="Title"
          value={effectiveNote?.title || localTitle || ''}
          onChange={handleTitleChange}
        />

        <EditorContent editor={editor} className="editor-wrapper" />
      </div>
    </main>
  )
}
