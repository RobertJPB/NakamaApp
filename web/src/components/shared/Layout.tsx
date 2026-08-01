import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import styles from './Layout.module.css'

interface LayoutProps { 
  children: React.ReactNode;
  hideNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideNav }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true'
  })

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar_collapsed', String(newState))
  }

  if (hideNav) {
    return (
      <div className={styles.appLayoutCollapsed} style={{ gridTemplateColumns: '1fr' }}>
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className={`${styles.appLayout} ${isCollapsed ? styles.appLayoutCollapsed : ''}`}>
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      <main className={styles.mainContent}>
        <Header />
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
