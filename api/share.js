// Share Token API - Express style for Vercel
const tokens = []

function generateToken() {
  return Math.random().toString(36).substring(2, 34) + Math.random().toString(36).substring(2, 34)
}

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')
  const noteId = url.searchParams.get('noteId')

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(204).send()
  }

  // GET ?token=xxx - Validate
  if (req.method === 'GET' && token) {
    const found = tokens.find(t => t.token === token && !t.revoked)
    if (found) {
      return res.status(200).json({ valid: true, noteId: found.noteId, noteTitle: found.noteTitle })
    }
    return res.status(404).json({ valid: false, error: 'Invalid token' })
  }

  // POST - Create token
  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      if (!body.noteId) {
        return res.status(400).json({ success: false, error: 'noteId required' })
      }
      const newToken = {
        token: generateToken(),
        noteId: body.noteId,
        noteTitle: body.noteTitle || 'Untitled',
        createdAt: Date.now(),
        revoked: false
      }
      const idx = tokens.findIndex(t => t.noteId === body.noteId)
      if (idx >= 0) tokens[idx] = newToken
      else tokens.push(newToken)
      
      return res.status(201).json({ success: true, data: newToken })
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message })
    }
  }

  // DELETE ?noteId=xxx - Revoke
  if (req.method === 'DELETE') {
    const idx = tokens.findIndex(t => t.noteId === noteId)
    if (idx >= 0) {
      tokens[idx].revoked = true
      return res.status(200).json({ success: true })
    }
    return res.status(404).json({ success: false, error: 'Not found' })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
