import React, { useState, useCallback, useMemo } from 'react'
import { formatTimeAgo, generatePreview } from '../../utils'
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
  
  // Use memoized format function
  const formattedDate = useMemo(() => formatTimeAgo(note.updatedAt), [note.updatedAt])

  // Use optimized preview generation
  const preview = useMemo(() => generatePreview(note.content, 100), [note.content])

  return (
    <li className={`note-item-wrapper ${isSelected ? 'selected' : ''}`}>
      <div
        className={`note-item ${isSelected ? 'selected' : ''}`}
        onClick={() => onClick(note.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick(note.id)}
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
            {preview}
          </p>
          
          <div className="note-item-footer">
            <span className="note-date">
              {formattedDate}
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
      </div>
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
  // Optimized grouping with useMemo
  const groupedNotes = useMemo(() => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    }
    
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const yesterdayStart = todayStart - 86400000
    const weekAgoStart = todayStart - 7 * 86400000
    
    for (const note of notes) {
      const noteDate = new Date(note.updatedAt).getTime()
      
      if (noteDate >= todayStart) {
        groups.today.push(note)
      } else if (noteDate >= yesterdayStart) {
        groups.yesterday.push(note)
      } else if (noteDate >= weekAgoStart) {
        groups.thisWeek.push(note)
      } else {
        groups.older.push(note)
      }
    }
    
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
