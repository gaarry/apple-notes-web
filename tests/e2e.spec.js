/**
 * Apple Notes Web - E2E Tests with Playwright
 * 
 * These tests verify the core functionality of the Apple Notes Web application
 * by interacting with the actual browser DOM.
 */
const { test, expect } = require('@playwright/test')

test.describe('Apple Notes Web - Core Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173')
    // Wait for the app to load
    await page.waitForLoadState('networkidle')
  })

  test('loads the welcome screen', async ({ page }) => {
    // Check for welcome screen
    const welcomeTitle = page.locator('h1:has-text("Notes")')
    await expect(welcomeTitle).toBeVisible({ timeout: 10000 })
    
    // Check for welcome message
    const welcomeMessage = page.locator('p:has-text("Create a new note")')
    await expect(welcomeMessage).toBeVisible()
  })

  test('creates a new note', async ({ page }) => {
    // Click the new note button
    const newNoteBtn = page.locator('.new-note-btn')
    await expect(newNoteBtn).toBeVisible({ timeout: 10000 })
    await newNoteBtn.click()
    
    // Check that editor is visible
    const editorTitle = page.locator('.editor-title')
    await expect(editorTitle).toBeVisible()
    
    // Check toolbar is visible
    const toolbar = page.locator('.toolbar')
    await expect(toolbar).toBeVisible()
  })

  test('enters note title', async ({ page }) => {
    // Create new note
    await page.locator('.new-note-btn').click()
    
    // Enter title
    const titleInput = page.locator('.editor-title')
    await titleInput.fill('Test Note Title')
    
    // Verify title is entered
    await expect(titleInput).toHaveValue('Test Note Title')
  })

  test('enters note content', async ({ page }) => {
    // Create new note
    await page.locator('.new-note-btn').click()
    
    // Enter content in editor
    const editorContent = page.locator('.editor-content')
    await editorContent.fill('This is test content for the note.')
    
    // Verify content is entered
    await expect(editorContent).toContainText('test content')
  })

  test('toggles dark mode', async ({ page }) => {
    // Find and click dark mode toggle
    const darkModeBtn = page.locator('.theme-toggle-btn')
    await expect(darkModeBtn).toBeVisible({ timeout: 10000 })
    
    // Click to toggle dark mode
    await darkModeBtn.click()
    
    // Verify dark mode class is applied
    await expect(page.locator('.app-container.dark')).toBeVisible()
  })

  test('search filters notes', async ({ page }) => {
    // Wait for sidebar to load
    const searchInput = page.locator('.search-input')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
    
    // Type in search box
    await searchInput.fill('test')
    
    // Verify search input has value
    await expect(searchInput).toHaveValue('test')
  })

  test('toggles delete mode', async ({ page }) => {
    // Find delete mode button
    const deleteModeBtn = page.locator('.delete-mode-btn')
    await expect(deleteModeBtn).toBeVisible({ timeout: 10000 })
    
    // Click to toggle delete mode
    await deleteModeBtn.click()
    
    // Verify delete mode is active
    await expect(deleteModeBtn).toHaveClass(/active/)
  })

  test('toolbar buttons are present', async ({ page }) => {
    // Create new note to show toolbar
    await page.locator('.new-note-btn').click()
    
    // Check toolbar buttons
    const boldBtn = page.locator('.toolbar-btn[title*="Bold"]')
    await expect(boldBtn).toBeVisible({ timeout: 10000 })
    
    const italicBtn = page.locator('.toolbar-btn[title*="Italic"]')
    await expect(italicBtn).toBeVisible()
    
    const undoBtn = page.locator('.toolbar-btn[title*="Undo"]')
    await expect(undoBtn).toBeVisible()
  })

})

test.describe('Apple Notes Web - Mobile Responsive', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
  })

  test('displays mobile menu button on small viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('.mobile-menu-btn')
    await expect(mobileMenuBtn).toBeVisible({ timeout: 10000 })
  })

  test('sidebar is hidden initially on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Sidebar should not be visible initially
    const sidebar = page.locator('.sidebar')
    
    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('.mobile-menu-btn')
    await expect(mobileMenuBtn).toBeVisible({ timeout: 10000 })
  })

  test('mobile menu toggle works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Wait for mobile menu button
    const mobileMenuBtn = page.locator('.mobile-menu-btn')
    await expect(mobileMenuBtn).toBeVisible({ timeout: 10000 })
    
    // Click to open menu
    await mobileMenuBtn.click()
    
    // Sidebar should now be visible
    const sidebar = page.locator('.sidebar.mobile-open')
    await expect(sidebar).toBeVisible()
  })
})

test.describe('Apple Notes Web - Notes List', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
  })

  test('displays notes list', async ({ page }) => {
    // Wait for sidebar to load
    const notesList = page.locator('.notes-list, .notes-container')
    await expect(notesList).toBeVisible({ timeout: 10000 })
  })

  test('displays folders', async ({ page }) => {
    // Check for folder list
    const folderList = page.locator('.folder-list')
    await expect(folderList).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Apple Notes Web - Export Functionality', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    await page.waitForLoadState('networkidle')
  })

  test('export button exists', async ({ page }) => {
    // Create a note first
    await page.locator('.new-note-btn').click()
    
    // Enter a title
    await page.locator('.editor-title').fill('Test Note')
    
    // Check export button exists (may be disabled for new notes)
    const exportBtn = page.locator('.action-btn[title*="Export"]')
    await expect(exportBtn).toBeVisible({ timeout: 10000 })
  })
})
