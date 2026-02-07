import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { generateId, storageGet, storageSet } from '../utils'

const NotesContext = createContext(null)

export function useNotes() {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([])
  const [folders, setFolders] = useState([
    { id: 'all', name: 'All Notes', icon: 'inbox' },
    { id: 'favorites', name: 'Favorites', icon: 'star' }
  ])
  const [activeFolder, setActiveFolder] = useState('all')
  const [loading, setLoading] = useState(true)

  // Load from localStorage
  useEffect(() => {
    const savedData = storageGet('apple-notes-web', null)
    if (savedData) {
      setNotes(savedData.notes || [])
      if (savedData.folders) {
        setFolders(savedData.folders)
      }
    }
    setLoading(false)
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (!loading) {
      storageSet('apple-notes-web', { notes, folders })
    }
  }, [notes, folders, loading])

  const createNote = useCallback((folderId = null, initialData = {}) => {
    const newNote = {
      id: generateId(),
      title: '',
      content: '',
      folderId: folderId || activeFolder,
      tags: [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...initialData
    }
    setNotes(prev => [newNote, ...prev])
    return newNote.id
  }, [activeFolder])

  const updateNote = useCallback((id, updates) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    ))
  }, [])

  const deleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(note => note.id !== id))
  }, [])

  const getNote = useCallback((id) => {
    return notes.find(note => note.id === id)
  }, [notes])

  // Import notes (for cloud sync)
  const importNotes = useCallback((importedNotes, merge = true) => {
    if (merge) {
      // Merge with existing notes, newer updates win
      const existingIds = new Set(notes.map(n => n.id))
      const newNotes = importedNotes.filter(n => !existingIds.has(n.id))
      const mergedNotes = [...newNotes, ...notes]
      setNotes(mergedNotes)
    } else {
      // Replace all notes
      setNotes(importedNotes)
    }
  }, [notes])

  const searchNotes = useCallback((query) => {
    if (!query.trim()) return getFilteredNotes()
    const lowerQuery = query.toLowerCase()
    return notes.filter(note => 
      (note.title?.toLowerCase().includes(lowerQuery) ||
      note.content?.toLowerCase().includes(lowerQuery)) &&
      shouldShowNote(note)
    )
  }, [notes, activeFolder])

  const shouldShowNote = useCallback((note) => {
    switch (activeFolder) {
      case 'all':
        return true
      case 'favorites':
        return note.isFavorite
      default:
        return note.folderId === activeFolder
    }
  }, [activeFolder])

  const getFilteredNotes = useCallback(() => {
    return notes.filter(shouldShowNote)
  }, [notes, shouldShowNote])

  const toggleFavorite = useCallback((id) => {
    setNotes(prev => prev.map(note =>
      note.id === id
        ? { ...note, isFavorite: !note.isFavorite, updatedAt: new Date().toISOString() }
        : note
    ))
  }, [])

  const addFolder = useCallback((name) => {
    const newFolder = {
      id: Date.now().toString(),
      name,
      icon: 'folder'
    }
    setFolders(prev => [...prev, newFolder])
    return newFolder.id
  }, [])

  const deleteFolder = useCallback((id) => {
    if (id === 'all' || id === 'favorites') return
    setFolders(prev => prev.filter(f => f.id !== id))
    setNotes(prev => prev.map(note =>
      note.folderId === id
        ? { ...note, folderId: 'all' }
        : note
    ))
    if (activeFolder === id) {
      setActiveFolder('all')
    }
  }, [activeFolder])

  const addTag = useCallback((noteId, tag) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, tags: [...new Set([...note.tags, tag])], updatedAt: new Date().toISOString() }
        : note
    ))
  }, [])

  const removeTag = useCallback((noteId, tagToRemove) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, tags: note.tags.filter(t => t !== tagToRemove), updatedAt: new Date().toISOString() }
        : note
    ))
  }, [])

  const moveNoteToFolder = useCallback((noteId, folderId) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId
        ? { ...note, folderId, updatedAt: new Date().toISOString() }
        : note
    ))
  }, [])

  const value = {
    notes,
    folders,
    activeFolder,
    setActiveFolder,
    loading,
    createNote,
    updateNote,
    deleteNote,
    getNote,
    searchNotes,
    getFilteredNotes,
    toggleFavorite,
    addFolder,
    deleteFolder,
    addTag,
    removeTag,
    moveNoteToFolder,
    importNotes
  }

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  )
}
