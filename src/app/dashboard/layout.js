'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiRequest } from '../../lib/api'
import styles from './shell.module.css'

const navigation = [
  { href: '/dashboard', title: 'Resumen', icon: '◈' },
  { href: '/dashboard/profile', title: 'Perfil y redes', icon: '◉' },
  { href: '/dashboard/projects', title: 'Proyectos', icon: '▦' },
  { href: '/dashboard/experience', title: 'Experiencia', icon: '▤' },
  { href: '/dashboard/skills', title: 'Habilidades', icon: '✳' },
  { href: '/dashboard/learning', title: 'Formación', icon: '◇' },
  { href: '/dashboard/resumes', title: 'Currículums', icon: '▧' },
  { href: '/dashboard/contacts', title: 'Contactos', icon: '✉' },
]
export default function DashboardLayout({ children }) {
  const pathname = usePathname(); const router = useRouter(); const [open, setOpen] = useState(false)
  useEffect(() => { if (!open) return; const closeOnEscape = event => { if (event.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape) }, [open])
  async function logout() { try { await apiRequest('/v1/auth/logout', { method: 'POST' }) } finally { router.replace('/') } }
  return <div className={styles.shell}>
    <header className={styles.mobileHeader}><Link href="/dashboard" className={styles.mobileBrand}>RN<span>_</span> ADMIN</Link><button type="button" aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen(!open)}>{open ? 'Cerrar' : 'Menú'} <span aria-hidden="true">{open ? '×' : '☰'}</span></button></header>
    <aside id="admin-menu" className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <Link href="/dashboard" className={styles.brand} onClick={() => setOpen(false)}><span className={styles.brandMark}>RN_</span><span>PORTFOLIO <small>CONTROL PANEL</small></span></Link>
      <p className={styles.navLabel}>NAVEGACIÓN <span>01—08</span></p>
      <nav aria-label="Administración" className={styles.navigation}>{navigation.map(item => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={styles.navLink} aria-current={(item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)) ? 'page' : undefined}><span className={styles.icon} aria-hidden="true">{item.icon}</span>{item.title}</Link>)}</nav>
      <div className={styles.bottom}><span className={styles.status}><i /> PORTAFOLIO / ADMIN</span><button type="button" onClick={logout}>↪ &nbsp; Cerrar sesión</button></div>
    </aside><div className={styles.content}>{children}</div>
  </div>
}
