const GITHUB_API_BASE = 'https://api.github.com/gists'

function buildPayload(notes = []) {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    notes: Array.isArray(notes) ? notes : [],
    folders: []
  }
}

async function fetchGist(gistId, token) {
  const url = `${GITHUB_API_BASE}/${gistId}`
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `token ${token}` } : {})
  }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    let details = null
    try {
      details = await res.json()
    } catch {
      details = { message: 'Failed to parse GitHub response' }
    }
    return { ok: false, status: res.status, details }
  }
  const data = await res.json()
  const content = data.files?.['notes.json']?.content
  if (!content) return { ok: true, notes: [] }
  try {
    const parsed = JSON.parse(content)
    const notes = Array.isArray(parsed) ? parsed : (parsed.notes || [])
    return { ok: true, notes }
  } catch {
    return { ok: true, notes: [] }
  }
}

async function saveGist(gistId, token, notes) {
  const url = `${GITHUB_API_BASE}/${gistId}`
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `token ${token}`,
    'Content-Type': 'application/json'
  }
  const body = JSON.stringify({
    description: 'My Notes - synced from Apple Notes Web',
    files: {
      'notes.json': {
        content: JSON.stringify(buildPayload(notes), null, 2)
      }
    }
  })
  const res = await fetch(url, { method: 'PATCH', headers, body })
  if (!res.ok) {
    let details = null
    try {
      details = await res.json()
    } catch {
      details = { message: 'Failed to parse GitHub response' }
    }
    return { ok: false, status: res.status, details }
  }
  return { ok: true }
}

export default async function handler(req, res) {
  const gistId = process.env.GIST_ID
  const token = process.env.GITHUB_TOKEN

  if (!gistId) {
    res.status(500).json({ success: false, error: 'GIST_ID not configured' })
    return
  }

  if (req.method === 'GET') {
    const result = await fetchGist(gistId, token)
    if (!result.ok) {
      res.status(result.status || 500).json({ 
        success: false, 
        error: 'Failed to fetch gist',
        status: result.status,
        details: result.details
      })
      return
    }
    res.status(200).json({ success: true, data: result.notes })
    return
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    if (!token) {
      res.status(500).json({ success: false, error: 'GITHUB_TOKEN not configured' })
      return
    }
    const notes = req.body?.notes || []
    const result = await saveGist(gistId, token, notes)
    if (!result.ok) {
      res.status(result.status || 500).json({ 
        success: false, 
        error: 'Failed to save gist',
        status: result.status,
        details: result.details
      })
      return
    }
    res.status(200).json({ success: true })
    return
  }

  res.status(405).json({ success: false, error: 'Method not allowed' })
}
