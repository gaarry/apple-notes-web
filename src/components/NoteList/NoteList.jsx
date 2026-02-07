import React, { useState, useCallback, useMemo } from 'react'
import { useNotes } from '../../context/NotesContext'
import './NoteList.css'

const NoteItem = React.memo(function NoteItem({ 
  note, 
  isSelected, 
  onClick, 
  onFavorite,
  onMoveToFolder,
  showActions 
}) {
  const [showMenu, setShowMenu] = useState(false)
  
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const getPreview = useCallback(() => {
    if (!note.content) return 'No content'
    const div = document.createElement('div')
    div.innerHTML = note.content
    const text = div.textContent || div.innerText || ''
    return text.slice(0, 100) + (text.length > 100 ? '...' : '')
  }, [note.content])

  return (
    <li className={`note-item-wrapper ${isSelected ? 'selected' : ''}`}>
      <button
        className={`note-item ${isSelected ? 'selected' : ''}`}
        onClick={() => onClick(note.id)}
        aria-current={isSelected ? 'true' : undefined}
      >
        <div className="note-item-content">
          <div className="note-item-header">
            <span className={`note-title ${!note.title ? 'empty' : ''}`}>
              {note.title || 'Untitled Note'}
            </span>
            {note.isFavorite && (
              <svg className="favorite-icon" viewBox="0 0 24 24" fill="#ff9500" stroke="#ff9500" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            )}
          </div>
          
          <p className="note-preview">
            {getPreview()}
          </p>
          
          <div className="note-item-footer">
            <span className="note-date">
              {formatDate(note.updatedAt)}
            </span>
            {note.tags && note.tags.length > 0 && (
              <div className="note-tags">
                {note.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="note-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {showActions && (
          <div className="note-item-actions">
            <button
              className={`note-action-btn ${note.isFavorite ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onFavorite(note.id)
              }}
              title={note.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg viewBox="0 0 24 24" fill={note.isFavorite ? '#ff9500' : 'none'} stroke="#ff9500" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>
        )}
      </button>
    </li>
  )
})

export default function NoteList({ 
  notes, 
  loading, 
  selectedNoteId, 
  onSelectNote,
  onFavorite,
  showActions = false,
  emptyMessage = 'No notes yet'
}) {
  const groupedNotes = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today - 86400000)
    const weekAgo = new Date(today - 7 * 86400000)
    
    notes.forEach(note => {
      const noteDate = new Date(note.updatedAt)
      
      if (noteDate >= today) {
        groups.today.push(note)
      } else if (noteDate >= yesterday) {
        groups.yesterday.push(note)
      } else if (noteDate >= weekAgo) {
        groups.thisWeek.push(note)
      } else {
        groups.older.push(note)
      }
    })
    
    return groups
  }, [notes])

  const renderGroup = (title, noteArray) => {
    if (noteArray.length === 0) return null
    
    return (
      <div key={title} className="note-group">
        {title && <div className="note-group-header">{title}</div>}
        <ul className="note-group-list">
          {noteArray.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onClick={onSelectNote}
              onFavorite={onFavorite}
              showActions={showActions}
            />
          ))}
        </ul>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="notes-loading">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-note">
            <div className="skeleton-line title" />
            <div className="skeleton-line content" />
            <div className="skeleton-line footer" />
          </div>
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    return (
      <div className="notes-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>{emptyMessage}</p>
        <span>Click the + button to create your first note</span>
      </div>
    )
  }

  return (
    <nav className="notes-nav">
      <div className="notes-container">
        {renderGroup('Today', groupedNotes.today)}
        {renderGroup('Yesterday', groupedNotes.yesterday)}
        {renderGroup('This Week', groupedNotes.thisWeek)}
        {renderGroup('Earlier', groupedNotes.older)}
      </div>
    </nav>
  )
}
