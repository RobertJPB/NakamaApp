import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import styles from './Layout.module.css'

interface LayoutProps { children: React.ReactNode }

export const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className={styles.appLayout}>
    <Sidebar />
    <main className={styles.mainContent}>
      <Header />
      {children}
    </main>
  </div>
)
