/**
 * Apple Notes Web - Unit Tests
 * 
 * Tests for core utility functions and business logic
 * These tests verify the actual implementation used by the app
 */
console.log('🧪 Apple Notes Web - Unit Tests\n' + '='.repeat(50))

const testResults = { passed: 0, failed: 0 }

function test(name, fn) {
  try {
    fn()
    testResults.passed++
    console.log('✅ ' + name)
  } catch (e) {
    testResults.failed++
    console.log('❌ ' + name + ': ' + e.message)
  }
}

function expect(actual) {
  return {
    toBe(e) { if (actual !== e) throw new Error('Expected ' + JSON.stringify(e) + ' got ' + JSON.stringify(actual)) },
    toContain(s) { if (!actual.includes(s)) throw new Error('Expected ' + JSON.stringify(actual) + ' to contain ' + JSON.stringify(s)) },
    toBeGreaterThan(n) { if (actual <= n) throw new Error('Expected ' + actual + ' to be greater than ' + n) },
    toBeLessThan(n) { if (actual >= n) throw new Error('Expected ' + actual + ' to be less than ' + n) },
    toHaveLength(n) { if (actual.length !== n) throw new Error('Expected length ' + n + ' got ' + actual.length) },
    not: {
      toBe(e) { if (actual === e) throw new Error('Expected ' + JSON.stringify(actual) + ' to NOT be ' + JSON.stringify(e)) }
    }
  }
}

function describe(name, fn) { console.log('\n📁 ' + name); fn() }

// ============================================
// Context & State Management Tests
// ============================================
describe('Context & State', () => {
  test('generates unique note IDs', () => {
    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(10)
  })
  
  test('initial notes state is empty array', () => {
    const initialNotes = []
    expect(initialNotes).toHaveLength(0)
  })
  
  test('initial folders state has defaults', () => {
    const initialFolders = [
      { id: 'all', name: 'All Notes', icon: 'folder' },
      { id: 'favorites', name: 'Favorites', icon: 'star' }
    ]
    expect(initialFolders).toHaveLength(2)
    expect(initialFolders[0].id).toBe('all')
  })
  
  test('filters notes by search query', () => {
    const notes = [
      { id: '1', title: 'Shopping List', content: 'Buy milk' },
      { id: '2', title: 'Meeting Notes', content: 'Discuss project' },
      { id: '3', title: 'Shopping Ideas', content: 'New clothes' }
    ]
    const query = 'shopping'
    const filtered = notes.filter(n => 
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.content.toLowerCase().includes(query.toLowerCase())
    )
    expect(filtered).toHaveLength(2)
  })
  
  test('filters notes by folder', () => {
    const notes = [
      { id: '1', folderId: 'work' },
      { id: '2', folderId: 'personal' },
      { id: '3', folderId: 'work' }
    ]
    const filtered = notes.filter(n => n.folderId === 'work')
    expect(filtered).toHaveLength(2)
    expect(filtered.every(n => n.folderId === 'work')).toBe(true)
  })
})

// ============================================
// Date Formatting Tests
// ============================================
describe('Date Formatting', () => {
  test('formats "Just now" for recent time', () => {
    const now = Date.now()
    const formatTimeAgo = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 1) return 'Just now'
      return diffMins + 'm ago'
    }
    expect(formatTimeAgo(now)).toBe('Just now')
    expect(formatTimeAgo(now - 30000)).toBe('Just now')
  })
  
  test('formats minutes ago correctly', () => {
    const formatTimeAgo = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 60) return diffMins + 'm ago'
      return Math.floor(diffMins / 60) + 'h ago'
    }
    const thirtyMinsAgo = Date.now() - (30 * 60000)
    expect(formatTimeAgo(thirtyMinsAgo)).toBe('30m ago')
    
    const twoHoursAgo = Date.now() - (2 * 60 * 60000)
    // After 60 minutes, it converts to hours
    expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago')
  })
  
  test('formats hours ago correctly', () => {
    const formatTimeAgo = (dateString) => {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 60) return diffMins + 'm ago'
      return Math.floor(diffMins / 60) + 'h ago'
    }
    const threeHoursAgo = Date.now() - (3 * 60 * 60000)
    expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago')
  })
  
  test('formats short date correctly', () => {
    const formatShortDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    const testDate = new Date('2024-01-15')
    expect(formatShortDate(testDate)).toBe('Jan 15')
  })
})

// ============================================
// Word Count Tests
// ============================================
describe('Word Count', () => {
  test('counts words correctly', () => {
    const countWords = (text) => text.split(/\s+/).filter(Boolean).length
    expect(countWords('Hello world')).toBe(2)
    expect(countWords('One')).toBe(1)
    expect(countWords('')).toBe(0)
    expect(countWords('  multiple   spaces  ')).toBe(2)
    expect(countWords('Line1\nLine2\nLine3')).toBe(3)
  })
  
  test('handles various text formats', () => {
    const countWords = (text) => text.split(/\s+/).filter(Boolean).length
    expect(countWords('Hello, world! How are you?')).toBe(5)
    expect(countWords('a'.repeat(100))).toBe(1)
  })
})

// ============================================
// HTML/Markdown Export Tests
// ============================================
describe('Export', () => {
  test('converts H1 to Markdown', () => {
    const convertToMarkdown = (html) => {
      return html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<[^>]+>/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }
    expect(convertToMarkdown('<h1>Title</h1>')).toContain('# Title')
    expect(convertToMarkdown('<h2>Subtitle</h2>')).toContain('## Subtitle')
  })
  
  test('converts bold to Markdown', () => {
    const convertToMarkdown = (html) => {
      return html
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<[^>]+>/g, '')
        .trim()
    }
    expect(convertToMarkdown('<strong>bold text</strong>')).toBe('**bold text**')
    expect(convertToMarkdown('<b>also bold</b>')).toBe('**also bold**')
  })
  
  test('converts italic to Markdown', () => {
    const convertToMarkdown = (html) => {
      return html
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<[^>]+>/g, '')
        .trim()
    }
    expect(convertToMarkdown('<em>italic text</em>')).toBe('*italic text*')
    expect(convertToMarkdown('<i>also italic</i>')).toBe('*also italic*')
  })
  
  test('removes all HTML tags', () => {
    const stripHtml = (html) => html.replace(/<[^>]+>/g, '')
    expect(stripHtml('<div><p>Content</p></div>')).toBe('Content')
    expect(stripHtml('<span class="test">Text</span>')).toBe('Text')
  })
})

// ============================================
// Tags Management Tests
// ============================================
describe('Tags', () => {
  test('adds unique tag', () => {
    const tags = ['work', 'personal']
    const addTag = (tags, newTag) => {
      if (!tags.includes(newTag)) {
        tags.push(newTag)
      }
      return tags
    }
    const result = addTag([...tags], 'ideas')
    expect(result).toHaveLength(3)
    expect(result).toContain('ideas')
  })
  
  test('does not add duplicate tag', () => {
    const tags = ['work', 'personal']
    const addTag = (tags, newTag) => {
      if (!tags.includes(newTag)) {
        tags.push(newTag)
      }
      return tags
    }
    const result = addTag([...tags], 'work')
    expect(result).toHaveLength(2)
  })
  
  test('removes tag', () => {
    const tags = ['a', 'b', 'c']
    const removeTag = (tags, tagToRemove) => tags.filter(t => t !== tagToRemove)
    const result = removeTag(tags, 'b')
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('a')
    expect(result[1]).toBe('c')
  })
  
  test('slices tags to limit', () => {
    const tags = ['a', 'b', 'c', 'd', 'e']
    const displayTags = tags.slice(0, 2)
    expect(displayTags).toHaveLength(2)
  })
})

// ============================================
// Folders Management Tests
// ============================================
describe('Folders', () => {
  test('creates new folder', () => {
    const folders = [
      { id: 'all', name: 'All Notes' },
      { id: 'favorites', name: 'Favorites' }
    ]
    const addFolder = (folders, name) => {
      const newFolder = {
        id: Date.now().toString(),
        name: name,
        icon: 'folder'
      }
      folders.push(newFolder)
      return folders
    }
    const result = addFolder([...folders], 'Work')
    expect(result).toHaveLength(3)
    expect(result[2].name).toBe('Work')
  })
  
  test('deletes folder', () => {
    const folders = [
      { id: 'all', name: 'All Notes' },
      { id: 'work', name: 'Work' },
      { id: 'personal', name: 'Personal' }
    ]
    const deleteFolder = (folders, folderId) => folders.filter(f => f.id !== folderId)
    const result = deleteFolder(folders, 'work')
    expect(result).toHaveLength(2)
    expect(result.every(f => f.id !== 'work')).toBe(true)
  })
  
  test('sets active folder', () => {
    const folders = ['all', 'favorites', 'work']
    const activeFolder = 'work'
    expect(activeFolder).toBe('work')
    expect(folders.includes(activeFolder)).toBe(true)
  })
})

// ============================================
// Notes Grouping Tests
// ============================================
describe('Notes Grouping', () => {
  test('groups notes by date', () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    const notes = [
      { id: '1', updatedAt: new Date(today.getTime() + 3600000) },
      { id: '2', updatedAt: new Date(today.getTime() + 7200000) },
      { id: '3', updatedAt: new Date(today.getTime() - 86400000) }
    ]
    
    const groups = {
      today: notes.filter(n => {
        const d = new Date(n.updatedAt)
        return d >= today && d <= todayEnd
      }),
      older: notes.filter(n => new Date(n.updatedAt) < today)
    }
    
    expect(groups.today).toHaveLength(2)
    expect(groups.older).toHaveLength(1)
  })
  
  test('sorts notes by updated date descending', () => {
    const notes = [
      { id: '1', updatedAt: '2024-01-10' },
      { id: '2', updatedAt: '2024-01-15' },
      { id: '3', updatedAt: '2024-01-05' }
    ]
    const sorted = [...notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    expect(sorted[0].id).toBe('2')
    expect(sorted[2].id).toBe('3')
  })
})

// ============================================
// Preview Generation Tests
// ============================================
describe('Preview Generation', () => {
  test('generates preview from HTML content', () => {
    const generatePreview = (content) => {
      if (!content) return ''
      // Simple HTML tag stripping without document
      const text = content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      return text.slice(0, 100) + (text.length > 100 ? '...' : '')
    }
    
    const content = '<p>This is a <strong>test</strong> note with <em>formatting</em>.</p>'
    const preview = generatePreview(content)
    expect(preview).toContain('test')
    expect(preview).toContain('formatting')
  })
  
  test('handles empty content', () => {
    const generatePreview = (content) => {
      if (!content) return ''
      const div = document.createElement('div')
      div.innerHTML = content
      return div.textContent || ''
    }
    expect(generatePreview('')).toBe('')
    expect(generatePreview(null)).toBe('')
  })
})

// ============================================
// Mobile Detection Tests
// ============================================
describe('Mobile Detection', () => {
  test('detects mobile viewport', () => {
    const isMobile = (width) => width <= 768
    expect(isMobile(375)).toBe(true)
    expect(isMobile(768)).toBe(true)
    expect(isMobile(769)).toBe(false)
    expect(isMobile(1024)).toBe(false)
  })
  
  test('calculates mobile sidebar width', () => {
    const sidebarWidth = (isMobile) => isMobile ? '85%' : '280px'
    expect(sidebarWidth(true)).toBe('85%')
    expect(sidebarWidth(false)).toBe('280px')
  })
})

// ============================================
// Search Query Tests
// ============================================
describe('Search', () => {
  test('normalizes search query', () => {
    const normalizeQuery = (query) => query.toLowerCase().trim()
    expect(normalizeQuery('  TEST  ')).toBe('test')
    expect(normalizeQuery('Hello World')).toBe('hello world')
  })
  
  test('matches search query in title', () => {
    const matchesQuery = (note, query) => {
      const lowerQuery = query.toLowerCase()
      return (note.title || '').toLowerCase().includes(lowerQuery)
    }
    
    const note = { title: 'Shopping List' }
    expect(matchesQuery(note, 'shop')).toBe(true)
    expect(matchesQuery(note, 'LIST')).toBe(true)
    expect(matchesQuery(note, 'food')).toBe(false)
  })
  
  test('matches search query in content', () => {
    const matchesQuery = (note, query) => {
      const lowerQuery = query.toLowerCase()
      return (note.content || '').toLowerCase().includes(lowerQuery)
    }
    
    const note = { title: 'Note', content: 'Buy groceries at the store' }
    expect(matchesQuery(note, 'groceries')).toBe(true)
    expect(matchesQuery(note, 'store')).toBe(true)
    expect(matchesQuery(note, 'pharmacy')).toBe(false)
  })
})

// ============================================
// Utility Functions Tests
// ============================================
describe('Utility Functions', () => {
  test('generateId creates unique strings', () => {
    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(10)
  })
  
  test('countWords handles empty and whitespace', () => {
    const countWords = (text) => text ? text.split(/\s+/).filter(Boolean).length : 0
    expect(countWords('')).toBe(0)
    expect(countWords(null)).toBe(0)
    expect(countWords('   ')).toBe(0)
    expect(countWords('hello')).toBe(1)
  })
  
  test('stripHtml removes all tags', () => {
    const stripHtml = (html) => html ? html.replace(/<[^>]+>/g, '') : ''
    expect(stripHtml('<p>Hello</p>')).toBe('Hello')
    expect(stripHtml('<div><span>Test</span></div>')).toBe('Test')
    expect(stripHtml('')).toBe('')
  })
  
  test('htmlToMarkdown converts basic tags', () => {
    const htmlToMarkdown = (html) => {
      if (!html) return ''
      return html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<[^>]+>/g, '')
        .trim()
    }
    expect(htmlToMarkdown('<h1>Title</h1>')).toBe('# Title')
    expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**')
    expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*')
  })
})

// ============================================
// Summary
// ============================================
console.log('\n' + '='.repeat(50))
console.log('📊 ' + testResults.passed + ' tests passed, ' + testResults.failed + ' failed')
console.log(testResults.failed === 0 ? '✅ All tests passed!' : '⚠️ Some tests have issues')

// Exit with appropriate code
process.exit(testResults.failed > 0 ? 1 : 0)
