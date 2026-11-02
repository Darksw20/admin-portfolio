'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { apiRequest } from '../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await apiRequest('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      router.push('/dashboard')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard} aria-labelledby="login-title">
        <p className={styles.eyebrow}>&gt; ADMIN_PORTFOLIO</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className={styles.intro}>Administra el contenido publicado de ricardonavarro.mx.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Usuario
            <input
              autoComplete="username"
              disabled={isSubmitting}
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label>
            Contraseña
            <input
              autoComplete="current-password"
              disabled={isSubmitting}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Validando…' : 'Entrar'}
          </button>
        </form>
        <p><Link href="/setup">Configuración inicial</Link></p>
      </section>
    </main>
  )
}
