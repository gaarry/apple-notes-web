import React from 'react'
import './Layout.css'

export default function Layout({ children, darkMode, isMobile }) {
  return (
    <div className={`app-container ${darkMode ? 'dark' : ''} ${isMobile ? 'mobile-view' : ''}`}>
      {children}
    </div>
  )
}
