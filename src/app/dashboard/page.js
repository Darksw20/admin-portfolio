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
      .then((response) => { if (response.user) setUser(response.user); else router.replace('/') })
      .catch(() => setError('No se pudo comprobar la sesión. Revisa la conexión con el servidor e inténtalo de nuevo.'))
  }, [router])

  if (error) {
    return <main className={styles.dashboardPage}><section className={styles.dashboardCard}><p role="alert">{error}</p><button type="button" onClick={() => window.location.reload()}>Reintentar</button></section></main>
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
          <span className={styles.sessionBadge}>● SESIÓN ACTIVA</span>
        </div>
        <p className={styles.welcome}>Sesión activa con rol: {user.roles.join(', ')}.</p>
        <p className={styles.sectionLabel}>CENTRO DE CONTROL / CONTENIDO</p>
        <div className={styles.dashboardTiles}>
          <Link href="/dashboard/projects"><span>01 / PORTAFOLIO</span><strong>Proyectos</strong><small>Administra tus trabajos, imágenes y enlaces.</small><b>↗</b></Link>
          <Link href="/dashboard/experience"><span>02 / CARRERA</span><strong>Experiencia laboral</strong><small>Administra puestos, logros y habilidades.</small><b>↗</b></Link>
          <Link href="/dashboard/skills"><span>02 / CONOCIMIENTO</span><strong>Habilidades</strong><small>Actualiza tus herramientas e idiomas.</small><b>↗</b></Link>
          <Link href="/dashboard/learning"><span>03 / TRAYECTORIA</span><strong>Formación</strong><small>Gestiona cursos, títulos y certificaciones.</small><b>↗</b></Link>
          <Link href="/dashboard/profile"><span>04 / IDENTIDAD</span><strong>Perfil y redes</strong><small>Edita tu historia y presentación.</small><b>↗</b></Link>
          <Link href="/dashboard/resumes"><span>06 / CV</span><strong>Currículums</strong><small>Personaliza y exporta tu trayectoria.</small><b>↗</b></Link>
          <Link href="/dashboard/contacts"><span>05 / BANDEJA</span><strong>Contactos</strong><small>Revisa los mensajes que recibes.</small><b>↗</b></Link>
        </div>
      </section>
    </main>
  )
}
