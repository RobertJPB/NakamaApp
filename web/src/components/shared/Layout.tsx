import React from 'react'
import { Navbar } from './Navbar'
import styles from './Layout.module.css'

interface LayoutProps { children: React.ReactNode }

export const Layout: React.FC<LayoutProps> = ({ children }) => (
  <div className={styles.root}>
    <Navbar />
    <main className={styles.main}>
      <div className={styles.contenido}>{children}</div>
    </main>
  </div>
)
