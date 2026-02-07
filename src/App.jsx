import React, { useState, useCallback, useEffect } from 'react'
import { NotesProvider } from './context/NotesContext.jsx'
import Sidebar from './components/Sidebar/Sidebar'
import Editor from './components/Editor/Editor'
import ExportMenu from './components/ExportMenu/ExportMenu'
import Layout from './components/Layout/Layout'
import { useKeyboardShortcuts } from './hooks/useKeyboard'

function AppContent() {
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteMode, setDeleteMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleSelectNote = useCallback((id) => {
    setSelectedNoteId(id)
    setDeleteMode(false)
  }, [])

  const handleCreateNote = useCallback(() => {
    setSelectedNoteId('new')
  }, [])

  const handleDeleteNote = useCallback((id) => {
    setSelectedNoteId(null)
  }, [])

  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  const handleToggleDeleteMode = useCallback(() => {
    setDeleteMode(prev => !prev)
    if (deleteMode) {
      setSelectedNoteId(null)
    }
  }, [deleteMode])

  const handleToggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev)
  }, [])

  const handleExport = useCallback(() => {
    if (selectedNoteId && selectedNoteId !== 'new') {
      setShowExportMenu(true)
    }
  }, [selectedNoteId])

  const handleCloseExportMenu = useCallback(() => {
    setShowExportMenu(false)
  }, [])

  // Keyboard shortcuts
  const shortcuts = {
    'ctrl+n': handleCreateNote,
    'ctrl+b': () => {
      const searchInput = document.querySelector('.search-input')
      if (searchInput) searchInput.focus()
    },
    'ctrl+d': handleToggleDeleteMode,
    'ctrl+/': handleToggleDarkMode,
    'ctrl+e': handleExport,
    'escape': () => {
      setSelectedNoteId(null)
      setDeleteMode(false)
      setShowExportMenu(false)
    }
  }

  useKeyboardShortcuts(shortcuts)

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <Layout darkMode={darkMode}>
      <Sidebar
        searchQuery={searchQuery}
        onSearch={handleSearch}
        onCreateNote={handleCreateNote}
        onSelectNote={handleSelectNote}
        selectedNoteId={selectedNoteId}
        deleteMode={deleteMode}
        onToggleDeleteMode={handleToggleDeleteMode}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />
      <Editor
        noteId={selectedNoteId}
        onDeleteNote={handleDeleteNote}
        deleteMode={deleteMode}
        onExport={handleExport}
      />
      
      {showExportMenu && (
        <ExportMenu 
          noteId={selectedNoteId} 
          onClose={handleCloseExportMenu} 
        />
      )}
    </Layout>
  )
}

function App() {
  return (
    <NotesProvider>
      <AppContent />
    </NotesProvider>
  )
}

export default App
