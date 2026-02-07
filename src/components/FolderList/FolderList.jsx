import React, { useState, useCallback } from 'react'
import { useNotes } from '../../context/NotesContext'
import './FolderList.css'

export default function FolderList({ 
  activeFolder, 
  onSelectFolder,
  onCreateNote 
}) {
  const { folders, addFolder, deleteFolder } = useNotes()
  const [isAdding, setIsAdding] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [showMenu, setShowMenu] = useState(null)

  const handleAddFolder = useCallback(() => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim())
      setNewFolderName('')
      setIsAdding(false)
    }
  }, [newFolderName, addFolder])

  const handleDeleteFolder = useCallback((folderId) => {
    deleteFolder(folderId)
    setShowMenu(null)
  }, [deleteFolder])

  const getFolderIcon = (icon) => {
    switch (icon) {
      case 'star':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      case 'inbox':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11L2a2 2 0 0 0 2 2h16v12a2 2 0 0 0 2 2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        )
    }
  }

  return (
    <div className="folder-list">
      <div className="folder-section">
        <div className="folder-header">
          <span className="folder-title">Folders</span>
          <button
            className="add-folder-btn"
            onClick={() => setIsAdding(true)}
            aria-label="Add folder"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {isAdding && (
          <div className="add-folder-form">
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFolder()
                if (e.key === 'Escape') setIsAdding(false)
              }}
              autoFocus
            />
            <button onClick={handleAddFolder}>Add</button>
          </div>
        )}

        <ul className="folder-items">
          {folders.map(folder => (
            <li key={folder.id}>
              <div
                className={`folder-item ${activeFolder === folder.id ? 'active' : ''}`}
                onClick={() => onSelectFolder(folder.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSelectFolder(folder.id)}
              >
                <span className="folder-icon">
                  {getFolderIcon(folder.icon)}
                </span>
                <span className="folder-name">{folder.name}</span>
                {folder.id !== 'all' && folder.id !== 'favorites' && (
                  <button
                    className="folder-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(showMenu === folder.id ? null : folder.id)
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </button>
                )}
              </div>
              {showMenu === folder.id && (
                <div className="folder-menu">
                  <button onClick={() => handleDeleteFolder(folder.id)}>
                    Delete Folder
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="folder-footer">
        <button className="new-note-folder-btn" onClick={onCreateNote}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>New Note</span>
        </button>
      </div>
    </div>
  )
}
