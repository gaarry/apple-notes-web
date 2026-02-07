/**
 * GitHub Storage Adapter
 * Use GitHub as a free backend for notes persistence
 */

const GITHUB_API_BASE = 'https://api.github.com'

class GitHubStorage {
  constructor() {
    this.token = localStorage.getItem('github_token')
    this.owner = localStorage.getItem('github_owner')
    this.repo = localStorage.getItem('github_repo') || 'my-notes'
    this.branch = localStorage.getItem('github_branch') || 'main'
  }

  isConfigured() {
    return !!(this.token && this.owner)
  }

  configure(token, owner, repo = 'my-notes', branch = 'main') {
    this.token = token
    this.owner = owner
    this.repo = repo
    this.branch = branch
    
    localStorage.setItem('github_token', token)
    localStorage.setItem('github_owner', owner)
    localStorage.setItem('github_repo', repo)
    localStorage.setItem('github_branch', branch)
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    }
  }

  // Initialize repository
  async initRepo(isPrivate = false) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}`,
        { headers: this.getHeaders() }
      )

      if (response.status === 404) {
        // Create new repository
        const createRes = await fetch(`${GITHUB_API_BASE}/user/repos`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            name: this.repo,
            description: 'My notes synced from Apple Notes Web',
            private: isPrivate,
            auto_init: true
          })
        })

        if (!createRes.ok) {
          throw new Error('Failed to create repository')
        }

        await this.createFile('README.md', '# My Notes\n\nSynced from Apple Notes Web')
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get file content
  async getFile(path) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`,
        { headers: this.getHeaders() }
      )

      if (response.status === 404) return null
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const data = await response.json()
      const content = atob(data.content.replace(/\n/g, ''))
      
      return { content, sha: data.sha, path: data.path }
    } catch (error) {
      return null
    }
  }

  // Create or update file
  async createFile(path, content, message = null) {
    try {
      const existing = await this.getFile(path)
      const encodedContent = btoa(unescape(encodeURIComponent(content)))
      
      const body = {
        message: message || `Update ${path}`,
        content: encodedContent,
        branch: this.branch
      }

      if (existing) body.sha = existing.sha

      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify(body)
        }
      )

      if (!response.ok) throw new Error('Failed to save file')

      const data = await response.json()
      return { success: true, sha: data.content?.sha }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Save note to GitHub
  async saveNote(note) {
    const filename = `notes/${note.id}.md`
    const content = this.noteToMarkdown(note)
    
    return await this.createFile(
      filename,
      content,
      `Update note: ${note.title || 'Untitled'}`
    )
  }

  // Convert note to Markdown with frontmatter
  noteToMarkdown(note) {
    const frontmatter = `---
id: ${note.id}
title: ${note.title || 'Untitled'}
folderId: ${note.folderId || 'all'}
isFavorite: ${note.isFavorite || false}
createdAt: ${note.createdAt}
updatedAt: ${note.updatedAt}
---

`
    return frontmatter + (note.content || '')
  }

  // Parse Markdown to note
  markdownToNote(content, id) {
    const lines = content.split('\n')
    let inFrontmatter = false
    let frontmatterEnd = 0
    const frontmatter = {}

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true
          continue
        } else {
          frontmatterEnd = i
          break
        }
      }

      if (inFrontmatter) {
        const [key, ...valueParts] = line.split(':')
        if (key && valueParts.length > 0) {
          let value = valueParts.join(':').trim()
          try {
            value = JSON.parse(value)
          } catch {
            // Keep as string
          }
          frontmatter[key.trim()] = value
        }
      }
    }

    const bodyContent = lines.slice(frontmatterEnd + 1).join('\n').trim()

    return {
      id: frontmatter.id || id,
      title: frontmatter.title || 'Untitled',
      content: bodyContent,
      folderId: frontmatter.folderId || 'all',
      isFavorite: frontmatter.isFavorite || false,
      tags: frontmatter.tags || [],
      createdAt: frontmatter.createdAt || new Date().toISOString(),
      updatedAt: frontmatter.updatedAt || new Date().toISOString()
    }
  }

  clearConfig() {
    localStorage.removeItem('github_token')
    localStorage.removeItem('github_owner')
    localStorage.removeItem('github_repo')
    localStorage.removeItem('github_branch')
    
    this.token = null
    this.owner = null
    this.repo = 'my-notes'
    this.branch = 'main'
  }
}

export const githubStorage = new GitHubStorage()
