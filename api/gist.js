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

async function fetchTokenUser(token) {
  if (!token) return { ok: false, error: 'Missing token' }
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${token}`
    }
  })
  if (!res.ok) {
    return { ok: false, status: res.status }
  }
  const data = await res.json()
  return { ok: true, login: data?.login || null }
}

async function fetchGistMeta(gistId, token) {
  const url = `${GITHUB_API_BASE}/${gistId}`
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    ...(token ? { Authorization: `token ${token}` } : {})
  }
  const res = await fetch(url, { headers })
  if (!res.ok) {
    return { ok: false, status: res.status }
  }
  const data = await res.json()
  return {
    ok: true,
    id: data?.id,
    owner: data?.owner?.login || null,
    updatedAt: data?.updated_at || null,
    files: data?.files ? Object.keys(data.files) : []
  }
}

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const debug = url.searchParams.get('debug') === '1'
  
  // Support gistId from query parameter (for share feature) or environment
  const queryGistId = url.searchParams.get('gistId')
  // Default gistId for sharing (notes storage gist)
  const defaultGistId = 'aabff1940df8f8666f76584089a682fd'
  const gistId = queryGistId || process.env.GIST_ID || defaultGistId
  const token = process.env.GITHUB_TOKEN

  if (!gistId) {
    res.status(500).json({ success: false, error: 'GIST_ID not configured' })
    return
  }

  if (req.method === 'GET') {
    if (debug) {
      const [tokenUser, gistMeta] = await Promise.all([
        fetchTokenUser(token),
        fetchGistMeta(gistId, token)
      ])
      res.status(200).json({
        success: true,
        gistId,
        tokenUser: tokenUser.ok ? tokenUser.login : null,
        gistOwner: gistMeta.ok ? gistMeta.owner : null,
        gistUpdatedAt: gistMeta.ok ? gistMeta.updatedAt : null,
        gistFiles: gistMeta.ok ? gistMeta.files : [],
        tokenUserError: tokenUser.ok ? null : tokenUser.status || tokenUser.error,
        gistMetaError: gistMeta.ok ? null : gistMeta.status
      })
      return
    }
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
