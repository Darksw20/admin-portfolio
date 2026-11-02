'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiRequest } from '../../lib/api'
import styles from '../page.module.css'
export default function Setup() {
  const router = useRouter(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); const data = new FormData(event.currentTarget)
    try { await apiRequest('/v1/auth/setup', { method: 'POST', headers: { 'X-Setup-Secret': data.get('secret') }, body: JSON.stringify({ username: data.get('username'), email: data.get('email'), password: data.get('password') }) }); router.push('/dashboard') }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <main className={styles.loginPage}><section className={styles.loginCard}><h1>Configuración inicial</h1><p className={styles.intro}>Crea el primer administrador con la clave de configuración del servidor.</p><form className={styles.form} onSubmit={submit}><label>Clave de configuración<input name="secret" type="password" required autoComplete="off" /></label><label>Usuario<input name="username" required minLength={3} maxLength={64} autoComplete="username" /></label><label>Correo<input name="email" type="email" required /></label><label>Contraseña<input name="password" type="password" required minLength={12} autoComplete="new-password" /></label>{error && <p className={styles.error} role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Creando…' : 'Crear administrador'}</button></form><p><Link href="/">Volver al inicio de sesión</Link></p></section></main>
}
