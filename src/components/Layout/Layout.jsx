import React from 'react'
import './Layout.css'

export default function Layout({ children, darkMode }) {
  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {children}
    </div>
  )
}
