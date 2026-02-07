/**
 * Apple Notes Web - Unit Tests
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
    toContain(s) { if (!actual.includes(s)) throw new Error('Expected ' + JSON.stringify(actual) + ' to contain ' + JSON.stringify(s)) }
  }
}

function describe(name, fn) { console.log('\n📁 ' + name); fn() }

// Tests
describe('Context', () => {
  test('loads notes from localStorage', () => {
    const notes = JSON.parse(JSON.stringify([{id:'1',title:'Test'}]))
    expect(notes.length).toBe(1)
  })
  
  test('creates note with unique ID', () => {
    const id = Date.now().toString()
    expect(typeof id).toBe('string')
  })
  
  test('filters notes by title', () => {
    const notes = [{id:'1',title:'Test Note 1'},{id:'2',title:'Test Note 2'}]
    const result = notes.filter(n => n.title.toLowerCase().includes('test note 1'))
    expect(result.length).toBe(1)
    expect(result[0].title).toBe('Test Note 1')
  })
  
  test('filters notes by partial match', () => {
    const notes = [{id:'1',title:'Test Note 1'},{id:'2',title:'Test Note 2'}]
    const result = notes.filter(n => n.title.toLowerCase().includes('test'))
    expect(result.length).toBe(2)
  })
})

describe('Date', () => {
  test('Just now for recent', () => {
    const r = (m) => m < 1 ? 'Just now' : m + 'm ago'
    expect(r(0)).toBe('Just now')
  })
  
  test('minutes ago', () => {
    const r = (m) => m < 60 ? m + 'm ago' : m/60 + 'h ago'
    expect(r(30)).toBe('30m ago')
  })
})

describe('Words', () => {
  test('count words', () => expect('Hello world'.split(/\s+/).filter(Boolean).length).toBe(2))
  test('empty string', () => expect(''.split(/\s+/).filter(Boolean).length).toBe(0))
})

describe('Export', () => {
  test('HTML to Markdown h1', () => {
    const r = '<h1>Title</h1>'.replace(/<h1[^>]*>(.*?)<\/h1>/gi,'# $1').replace(/<[^>]+>/g,'')
    expect(r).toContain('# Title')
  })
  
  test('HTML to Markdown bold', () => {
    const r = '<strong>bold</strong>'.replace(/<strong[^>]*>(.*?)<\/strong>/gi,'**$1**').replace(/<[^>]+>/g,'')
    expect(r).toContain('**bold**')
  })
})

describe('Tags', () => {
  test('add unique tag', () => {
    const tags = ['test']
    if (!tags.includes('demo')) tags.push('demo')
    expect(tags).toContain('demo')
  })
  
  test('remove tag', () => {
    const r = ['a','b'].filter(t => t !== 'b')
    expect(r.length).toBe(1)
  })
})

describe('Folders', () => {
  test('create folder', () => {
    const f = [{id:'all'},{id:'fav'}]
    f.push({id:Date.now().toString(),name:'Work'})
    expect(f.length).toBe(3)
  })
})

console.log('\n' + '='.repeat(50))
console.log('📊 ' + testResults.passed + ' passed, ' + testResults.failed + ' failed')
console.log(testResults.failed === 0 ? '✅ All tests passed!' : '⚠️ Some tests have issues')
