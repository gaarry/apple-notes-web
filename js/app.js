/**
 * Apple Notes Web - Main Application
 * A beautiful, Apple-inspired notes web application
 */

// ===============================
// Application State
// ===============================
const AppState = {
    notes: [],
    currentNote: null,
    searchQuery: '',
    isDeleteMode: false,
    
    // Get notes from localStorage
    loadNotes() {
        try {
            const saved = localStorage.getItem('apple-notes-web');
            this.notes = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load notes:', e);
            this.notes = [];
        }
    },
    
    // Save notes to localStorage
    saveNotes() {
        try {
            localStorage.setItem('apple-notes-web', JSON.stringify(this.notes));
        } catch (e) {
            console.error('Failed to save notes:', e);
        }
    },
    
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        // Less than 1 minute
        if (diff < 60000) {
            return 'Just now';
        }
        
        // Less than 1 hour
        if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins} min ago`;
        }
        
        // Less than 24 hours
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        }
        
        // Same year
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
        
        // Different year
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
};

// ===============================
// DOM Elements
// ===============================
const Elements = {
    sidebar: document.getElementById('sidebar'),
    notesList: document.getElementById('notes-list'),
    searchInput: document.getElementById('search-input'),
    newNoteBtn: document.getElementById('new-note-btn'),
    deleteModeBtn: document.getElementById('delete-mode-btn'),
    welcomeScreen: document.getElementById('welcome-screen'),
    editorContainer: document.getElementById('editor-container'),
    editor: document.getElementById('editor'),
    noteDate: document.getElementById('note-date'),
    wordCount: document.getElementById('word-count'),
    shareBtn: document.getElementById('share-btn')
};

// ===============================
// Render Functions
// ===============================
const Render = {
    // Render notes list
    notesList() {
        const query = AppState.searchQuery.toLowerCase();
        let filteredNotes = AppState.notes;
        
        // Filter by search query
        if (query) {
            filteredNotes = filteredNotes.filter(note => {
                const title = (note.title || '').toLowerCase();
                const content = (note.content || '').toLowerCase();
                return title.includes(query) || content.includes(query);
            });
        }
        
        // Sort by modified date (newest first)
        filteredNotes.sort((a, b) => new Date(b.modified) - new Date(a.modified));
        
        // Clear current list
        Elements.notesList.innerHTML = '';
        
        if (filteredNotes.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-notes';
            emptyMsg.textContent = query ? 'No notes found' : 'No notes yet';
            Elements.notesList.appendChild(emptyMsg);
            return;
        }
        
        // Render each note
        filteredNotes.forEach(note => {
            const li = document.createElement('li');
            li.className = 'note-item';
            if (AppState.currentNote && AppState.currentNote.id === note.id) {
                li.classList.add('active');
            }
            if (AppState.isDeleteMode) {
                li.classList.add('deleting');
            }
            
            // Generate preview from content (strip HTML)
            const preview = note.content
                ? note.content.replace(/<[^>]*>/g, '').substring(0, 100)
                : 'No content';
            
            li.innerHTML = `
                <div class="note-title">${note.title || 'Untitled'}</div>
                <div class="note-preview">${preview}</div>
                <div class="note-meta">
                    <span class="note-date">${AppState.formatDate(note.modified)}</span>
                </div>
            `;
            
            // Click handler
            li.addEventListener('click', () => {
                if (AppState.isDeleteMode) {
                    Actions.deleteNote(note.id);
                } else {
                    Actions.selectNote(note.id);
                }
            });
            
            Elements.notesList.appendChild(li);
        });
    },
    
    // Render editor
    editor() {
        if (!AppState.currentNote) {
            Elements.welcomeScreen.style.display = 'flex';
            Elements.editorContainer.style.display = 'none';
            return;
        }
        
        Elements.welcomeScreen.style.display = 'none';
        Elements.editorContainer.style.display = 'flex';
        
        // Set content
        Elements.editor.innerHTML = AppState.currentNote.content || '';
        Elements.noteDate.textContent = AppState.formatDate(AppState.currentNote.modified);
        
        // Update word count
        this.updateWordCount();
        
        // Focus editor
        Elements.editor.focus();
    },
    
    // Update word count
    updateWordCount() {
        if (!AppState.currentNote) {
            Elements.wordCount.textContent = '';
            return;
        }
        
        const text = Elements.editor.innerText || '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        Elements.wordCount.textContent = `${words} words · ${chars} characters`;
    }
};

// ===============================
// Actions
// ===============================
const Actions = {
    // Create new note
    createNote() {
        const note = {
            id: AppState.generateId(),
            title: '',
            content: '',
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        AppState.notes.unshift(note);
        AppState.saveNotes();
        AppState.currentNote = note;
        
        Render.notesList();
        Render.editor();
        
        // Focus editor and set cursor
        setTimeout(() => {
            Elements.editor.focus();
        }, 100);
    },
    
    // Select note
    selectNote(id) {
        AppState.currentNote = AppState.notes.find(n => n.id === id);
        if (AppState.currentNote) {
            Render.notesList();
            Render.editor();
        }
    },
    
    // Update current note
    updateNote(content, title) {
        if (!AppState.currentNote) return;
        
        AppState.currentNote.content = content;
        AppState.currentNote.title = title;
        AppState.currentNote.modified = new Date().toISOString();
        
        AppState.saveNotes();
        Render.notesList();
        Render.updateWordCount();
    },
    
    // Delete note
    deleteNote(id) {
        const index = AppState.notes.findIndex(n => n.id === id);
        if (index === -1) return;
        
        AppState.notes.splice(index, 1);
        AppState.saveNotes();
        
        if (AppState.currentNote && AppState.currentNote.id === id) {
            AppState.currentNote = null;
        }
        
        Render.notesList();
        Render.editor();
    },
    
    // Toggle delete mode
    toggleDeleteMode() {
        AppState.isDeleteMode = !AppState.isDeleteMode;
        Elements.deleteModeBtn.classList.toggle('active', AppState.isDeleteMode);
        Render.notesList();
    },
    
    // Search
    search(query) {
        AppState.searchQuery = query;
        Render.notesList();
    },
    
    // Share note
    shareNote() {
        if (!AppState.currentNote) return;
        
        const shareData = {
            title: AppState.currentNote.title || 'Untitled',
            text: AppState.currentNote.content ? AppState.currentNote.content.replace(/<[^>]*>/g, '') : ''
        };
        
        if (navigator.share) {
            navigator.share(shareData)
                .catch(console.error);
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareData.text)
                .then(() => {
                    showToast('Copied to clipboard');
                })
                .catch(console.error);
        }
    }
};

// ===============================
// Event Listeners
// ===============================
function initEventListeners() {
    // New note button
    Elements.newNoteBtn.addEventListener('click', () => {
        Actions.createNote();
    });
    
    // Delete mode toggle
    Elements.deleteModeBtn.addEventListener('click', () => {
        Actions.toggleDeleteMode();
    });
    
    // Search input
    Elements.searchInput.addEventListener('input', (e) => {
        Actions.search(e.target.value);
    });
    
    // Editor input
    Elements.editor.addEventListener('input', () => {
        // Generate title from first line
        const content = Elements.editor.innerHTML;
        const textContent = Elements.editor.innerText || '';
        const firstLine = textContent.split('\n')[0].trim().substring(0, 50);
        const title = firstLine || 'Untitled';
        
        Actions.updateNote(content, title);
    });
    
    // Share button
    Elements.shareBtn.addEventListener('click', () => {
        Actions.shareNote();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + N: New note
        if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
            e.preventDefault();
            Actions.createNote();
        }
        
        // Escape: Cancel delete mode or deselect note
        if (e.key === 'Escape') {
            if (AppState.isDeleteMode) {
                Actions.toggleDeleteMode();
            } else if (AppState.currentNote) {
                AppState.currentNote = null;
                Render.notesList();
                Render.editor();
            }
        }
        
        // Backspace in delete mode on a note
        if (e.key === 'Backspace' && AppState.isDeleteMode && AppState.currentNote) {
            Actions.deleteNote(AppState.currentNote.id);
            Actions.toggleDeleteMode();
        }
    });
    
    // Paste plain text
    Elements.editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    });
}

// ===============================
// Toast Notifications
// ===============================
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 1000;
        animation: fadeInUp 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ===============================
// Initialize Application
// ===============================
function init() {
    AppState.loadNotes();
    Render.notesList();
    Render.editor();
    initEventListeners();
    
    console.log('🍎 Apple Notes Web initialized');
    console.log('⌨️  Keyboard shortcuts:');
    console.log('   Cmd/Ctrl + N: New note');
    console.log('   Esc: Cancel/Back');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
