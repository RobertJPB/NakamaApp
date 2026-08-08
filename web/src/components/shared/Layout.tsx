import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { FastScroll } from '../ui/FastScroll'
import styles from './Layout.module.css'

interface LayoutProps { 
  children: React.ReactNode;
  hideNav?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, hideNav }) => {
  if (hideNav) {
    return (
      <div className={styles.appLayoutCollapsed} style={{ gridTemplateColumns: '1fr' }}>
        <main className={styles.mainContent}>
          {children}
        </main>
        <FastScroll />
      </div>
    )
  }

  return (
    <div className={`${styles.appLayout} ${styles.appLayoutCollapsed}`}>
      <Sidebar />
      <main className={styles.mainContent}>
        <Header />
        {children}
      </main>
      <BottomNav />
      <FastScroll />
    </div>
  )
}
