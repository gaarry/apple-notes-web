/**
 * Apple Notes Web - Unit Tests
 *
 * Tests for core utility functions used by the app
 */
import {
  formatTimeAgo,
  formatLongDate,
  formatShortDate,
  countWords,
  generatePreview,
  stripHtml,
  htmlToMarkdown,
  generateId,
  isMobileViewport,
  debounce,
  storageGet,
  storageSet
} from './src/utils/index.js'

console.log('🧪 Apple Notes Web - Unit Tests\n' + '='.repeat(50))

const testResults = { passed: 0, failed: 0 }
const tests = []

function test(name, fn) {
  tests.push({ name, fn })
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

function createLocalStorageMock() {
  let store = {}
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null },
    setItem(key, value) { store[key] = String(value) },
    removeItem(key) { delete store[key] },
    clear() { store = {} }
  }
}

globalThis.localStorage = createLocalStorageMock()

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ============================================
// Date Formatting Tests
// ============================================
describe('Date Formatting', () => {
  test('formats "Just now" for recent time', () => {
    const now = Date.now()
    expect(formatTimeAgo(now)).toBe('Just now')
    expect(formatTimeAgo(now - 30000)).toBe('Just now')
  })

  test('formats minutes and hours correctly', () => {
    const thirtyMinsAgo = Date.now() - (30 * 60000)
    expect(formatTimeAgo(thirtyMinsAgo)).toBe('30m ago')

    const twoHoursAgo = Date.now() - (2 * 60 * 60000)
    expect(formatTimeAgo(twoHoursAgo)).toBe('2h ago')
  })

  test('formats days and older dates correctly', () => {
    const threeDaysAgo = Date.now() - (3 * 24 * 60 * 60000)
    expect(formatTimeAgo(threeDaysAgo)).toBe('3d ago')

    const fixedDate = new Date(Date.UTC(2024, 0, 15, 12, 0, 0))
    const expected = fixedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const tenDaysAgo = new Date(Date.now() - (10 * 24 * 60 * 60000))
    const longExpected = tenDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    expect(formatTimeAgo(tenDaysAgo)).toBe(longExpected)
    expect(formatShortDate(fixedDate)).toBe(expected)
  })

  test('formats long date correctly', () => {
    const testDate = new Date('2024-01-15T12:00:00Z')
    const expected = testDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
    expect(formatLongDate(testDate)).toBe(expected)
    expect(formatLongDate(null)).toBe('Just now')
  })
})

// ============================================
// Word Count Tests
// ============================================
describe('Word Count', () => {
  test('counts words correctly', () => {
    expect(countWords('Hello world')).toBe(2)
    expect(countWords('One')).toBe(1)
    expect(countWords('')).toBe(0)
    expect(countWords('  multiple   spaces  ')).toBe(2)
    expect(countWords('Line1\nLine2\nLine3')).toBe(3)
  })

  test('handles non-string input', () => {
    expect(countWords(null)).toBe(0)
    expect(countWords(undefined)).toBe(0)
    expect(countWords(123)).toBe(0)
  })
})

// ============================================
// HTML / Markdown Tests
// ============================================
describe('HTML Processing', () => {
  test('generates preview from HTML content', () => {
    const content = '<p>This is a <strong>test</strong> note with <em>formatting</em>.</p>'
    const preview = generatePreview(content, 100)
    expect(preview).toContain('test')
    expect(preview).toContain('formatting')
  })

  test('handles empty preview content', () => {
    expect(generatePreview('')).toBe('No content')
    expect(generatePreview(null)).toBe('No content')
  })

  test('stripHtml removes all tags', () => {
    expect(stripHtml('<div><p>Content</p></div>')).toBe('Content')
    expect(stripHtml('<span class="test">Text</span>')).toBe('Text')
    expect(stripHtml('')).toBe('')
  })

  test('htmlToMarkdown converts basic tags', () => {
    expect(htmlToMarkdown('<h1>Title</h1>')).toBe('# Title')
    expect(htmlToMarkdown('<strong>bold</strong>')).toBe('**bold**')
    expect(htmlToMarkdown('<em>italic</em>')).toBe('*italic*')
    expect(htmlToMarkdown('<a href="https://example.com">Link</a>')).toBe('[Link](https://example.com)')
  })
})

// ============================================
// Utility Functions Tests
// ============================================
describe('Utility Functions', () => {
  test('generateId creates unique strings', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(10)
  })

  test('detects mobile viewport', () => {
    expect(isMobileViewport(375)).toBe(true)
    expect(isMobileViewport(768)).toBe(true)
    expect(isMobileViewport(769)).toBe(false)
    expect(isMobileViewport(1024)).toBe(false)
  })

  test('debounce delays execution', async () => {
    let callCount = 0
    const fn = () => { callCount += 1 }
    const debounced = debounce(fn, 30)
    debounced()
    debounced()
    debounced()
    await sleep(60)
    expect(callCount).toBe(1)
  })
})

// ============================================
// Storage Tests
// ============================================
describe('Storage', () => {
  test('storageSet and storageGet round-trip', () => {
    const key = 'test-key'
    const value = { a: 1, b: 'ok' }
    storageSet(key, value)
    const result = storageGet(key)
    expect(JSON.stringify(result)).toBe(JSON.stringify(value))
    expect(result.a).toBe(1)
  })

  test('storageGet returns default on bad data', () => {
    const originalError = console.error
    console.error = () => {}
    localStorage.setItem('bad-json', '{')
    const fallback = { ok: true }
    expect(storageGet('bad-json', fallback)).toBe(fallback)
    console.error = originalError
  })
})

// ============================================
// Runner
// ============================================
for (const entry of tests) {
  try {
    const result = entry.fn()
    if (result instanceof Promise) {
      await result
    }
    testResults.passed++
    console.log('✅ ' + entry.name)
  } catch (e) {
    testResults.failed++
    console.log('❌ ' + entry.name + ': ' + e.message)
  }
}

console.log('\n' + '='.repeat(50))
console.log('📊 ' + testResults.passed + ' tests passed, ' + testResults.failed + ' failed')
console.log(testResults.failed === 0 ? '✅ All tests passed!' : '⚠️ Some tests have issues')

process.exit(testResults.failed > 0 ? 1 : 0)
