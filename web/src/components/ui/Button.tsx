import React from 'react'
import styles from './Button.module.css'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro'
type Tamano   = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?:   Tamano
  cargando?: boolean
  icono?:    React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variante  = 'primario',
  tamano    = 'md',
  cargando  = false,
  icono,
  children,
  disabled,
  className = '',
  ...props
}) => (
  <button
    className={`${styles.btn} ${styles[variante]} ${styles[tamano]} ${className}`}
    disabled={disabled || cargando}
    {...props}
  >
    {cargando ? <span className={styles.spinner} /> : icono}
    {children && <span>{children}</span>}
  </button>
)
