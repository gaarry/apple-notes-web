import React, { useState, useCallback } from 'react'
import { useNotes } from '../../context/NotesContext'
import Search from '../Search/Search'
import NoteList from '../NoteList/NoteList'
import FolderList from '../FolderList/FolderList'
import './Sidebar.css'

export default function Sidebar({
  searchQuery,
  onSearch,
  onCreateNote,
  onSelectNote,
  selectedNoteId,
  deleteMode,
  onToggleDeleteMode,
  darkMode,
  onToggleDarkMode,
  mobileOpen,
  onCloseMobileMenu
}) {
  const { activeFolder, setActiveFolder, getFilteredNotes, toggleFavorite } = useNotes()

  const handleSelectFolder = useCallback((folderId) => {
    setActiveFolder(folderId)
  }, [])

  const handleNoteClick = useCallback((noteId) => {
    if (deleteMode) {
      toggleFavorite(noteId)
    } else {
      onSelectNote(noteId)
    }
  }, [deleteMode, toggleFavorite, onSelectNote])

  const filteredNotes = getFilteredNotes().filter(note => {
    if (!searchQuery.trim()) return true
    const lowerQuery = searchQuery.toLowerCase()
    return (
      (note.title || '').toLowerCase().includes(lowerQuery) ||
      (note.content || '').toLowerCase().includes(lowerQuery)
    )
  })

  return (
    <aside 
      className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} 
      role="complementary" 
      aria-label="Notes sidebar"
    >
      <div className="sidebar-header">
        <Search
          query={searchQuery}
          onChange={onSearch}
        />
        <button
          className="new-note-btn"
          onClick={onCreateNote}
          title="New Note (Ctrl+N)"
          aria-label="Create new note"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <FolderList
        activeFolder={activeFolder}
        onSelectFolder={handleSelectFolder}
        onCreateNote={onCreateNote}
      />

      <NoteList
        notes={filteredNotes}
        selectedNoteId={selectedNoteId}
        onSelectNote={handleNoteClick}
        onFavorite={toggleFavorite}
        showActions={true}
      />

      <div className="sidebar-footer">
        <button
          className={`theme-toggle-btn ${darkMode ? 'active' : ''}`}
          onClick={onToggleDarkMode}
          title="Toggle Dark Mode (Ctrl+/)"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <svg className="sun-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <svg className="moon-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
        <button
          className={`delete-mode-btn ${deleteMode ? 'active' : ''}`}
          onClick={onToggleDeleteMode}
          title="Delete Mode (Ctrl+D)"
          aria-label={deleteMode ? 'Disable delete mode' : 'Enable delete mode'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
