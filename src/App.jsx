import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { NotesProvider, useNotes } from './context/NotesContext.jsx'
import Sidebar from './components/Sidebar/Sidebar'
import Editor from './components/Editor/Editor'
import ExportMenu from './components/ExportMenu/ExportMenu'
import Layout from './components/Layout/Layout'
import GistSync from './components/GistSync/GistSync'
import SharePage from './pages/SharePage'
import { useKeyboardShortcuts } from './hooks/useKeyboard'
import { gistStorage } from './lib/gistStorage'

function AppContent() {
  // Check if we're on a share page
  const [isSharePage, setIsSharePage] = useState(false)
  const [shareParams, setShareParams] = useState(null)
  const [selectedNoteId, setSelectedNoteId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteMode, setDeleteMode] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [cloudSaveStatus, setCloudSaveStatus] = useState(null)
  const autoSaveTimeoutRef = useRef(null)
  const autoLoadDoneRef = useRef(false)

  // Detect mobile viewport
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.matchMedia) {
      const checkMobile = () => setIsMobile(window.innerWidth <= 768)
      checkMobile()
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleChange = (event) => setIsMobile(event.matches)
    setIsMobile(mediaQuery.matches)

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  const handleSelectNote = useCallback((id) => {
    setSelectedNoteId(id)
    setDeleteMode(false)
    // Close mobile menu when selecting a note
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }, [isMobile])

  const handleCreateNote = useCallback(() => {
    setSelectedNoteId('new')
    if (isMobile) {
      setMobileMenuOpen(false)
    }
  }, [isMobile])

  const handleDeleteNote = useCallback((id) => {
    setSelectedNoteId(null)
  }, [])

  const handleNoteCreated = useCallback((newId) => {
    // Update selected note ID to the newly created note's actual ID
    setSelectedNoteId(newId)
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

  const handleToggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  const handleSaveToCloud = useCallback(async (notesOverride = null) => {
    setCloudSaveStatus({ type: 'info', message: 'Saving to cloud...' })
    const result = await gistStorage.saveNotes(notesOverride || notes)
    if (result.success) {
      setCloudSaveStatus({
        type: 'success',
        message: result.fallback ? 'Saved to local cache' : 'Saved to cloud'
      })
      return
    }
    setCloudSaveStatus({ type: 'error', message: result.error || 'Cloud save failed' })
  }, [notes])

  useEffect(() => {
    if (loading || autoLoadDoneRef.current) return
    autoLoadDoneRef.current = true

    const loadFromCloud = async () => {
      const result = await gistStorage.fetchNotes()
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        importNotes(result.data, false)
      }
    }

    loadFromCloud()
  }, [loading, importNotes, notes.length])

  useEffect(() => {
    if (loading || !autoLoadDoneRef.current) return
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      gistStorage.saveNotes(notes)
    }, 1500)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [notes, loading])

  // Keyboard shortcuts
  const shortcuts = useMemo(() => ({
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
      setMobileMenuOpen(false)
    }
  }), [handleCreateNote, handleToggleDeleteMode, handleToggleDarkMode, handleExport])

  useKeyboardShortcuts(shortcuts)

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (!isMobile) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : previousOverflow || ''
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobile, mobileMenuOpen])

  return (
    <Layout darkMode={darkMode} isMobile={isMobile}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          className="mobile-menu-btn"
          onClick={handleToggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div className="mobile-overlay" onClick={handleToggleMobileMenu} />
      )}

      {/* Sidebar with mobile state */}
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
        mobileOpen={mobileMenuOpen}
        onCloseMobileMenu={() => setMobileMenuOpen(false)}
        isMobile={isMobile}
      />
      <Editor
        noteId={selectedNoteId}
        onDeleteNote={handleDeleteNote}
        onNoteCreated={handleNoteCreated}
        deleteMode={deleteMode}
        onExport={handleExport}
        isMobile={isMobile}
        onSaveToCloud={handleSaveToCloud}
        cloudSaveStatus={cloudSaveStatus}
      />
      
      {showExportMenu && (
        <ExportMenu 
          noteId={selectedNoteId} 
          onClose={handleCloseExportMenu} 
        />
      )}
      
      {/* Gist Sync - available globally */}
      <div className="gist-sync-container">
        <GistSync 
          notes={notes} 
          onNotesLoaded={importNotes}
        />
      </div>

      {/* Share Page - overrides everything else */}
      {isSharePage && shareParams && (
        <SharePage noteId={shareParams.noteId} shareToken={shareParams.token} />
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
