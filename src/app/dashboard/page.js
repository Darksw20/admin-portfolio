'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '../page.module.css'
import { apiRequest } from '../../lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/v1/auth/session')
      .then((response) => setUser(response.user))
      .catch(() => router.replace('/'))
  }, [router])

  async function logout() {
    try {
      await apiRequest('/v1/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/')
    }
  }

  if (!user) {
    return <main className={styles.dashboardPage}>Verificando sesión…</main>
  }

  return (
    <main className={styles.dashboardPage}>
      <section className={styles.dashboardCard} aria-labelledby="dashboard-title">
        <div className={styles.dashboardHeader}>
          <div>
            <p className={styles.eyebrow}>&gt; DASHBOARD</p>
            <h1 id="dashboard-title">Hola, {user.username}</h1>
          </div>
          <button className={styles.logoutButton} onClick={logout} type="button">Cerrar sesión</button>
        </div>
        <p className={styles.welcome}>Sesión activa con rol: {user.roles.join(', ')}.</p>
        <div className={styles.actions}>
          <Link className={styles.primaryLink} href="/dashboard/projects">Gestionar proyectos</Link>
          <Link className={styles.secondaryLink} href="/dashboard/skills">Gestionar habilidades</Link>
          <Link className={styles.secondaryLink} href="/dashboard/learning">Gestionar formación</Link>
          <Link className={styles.secondaryLink} href="/dashboard/contacts">Revisar contactos</Link>
        </div>
        <div className={styles.placeholder}>La gestión de cursos, certificaciones, contenido y contactos aparecerá aquí en los siguientes pasos.</div>
      </section>
    </main>
  )
}
