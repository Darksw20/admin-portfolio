'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiRequest } from '../../../lib/api'
import FormDialog from '../../../components/FormDialog'
import ImageUpload from '../../../components/ImageUpload'
import styles from '../../page.module.css'

const empty = locale => ({ locale, displayName: '', headline: '', biography: '', workHistory: '' })
export default function ProfilePage() {
  const [hasData, setHasData] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const router = useRouter()
  const [translations, setTranslations] = useState([empty('es-MX'), empty('en-US')])
  const [links, setLinks] = useState([])
  const [photoUrl, setPhotoUrl] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => { apiRequest('/v1/admin/profile').then(data => {
    setTranslations(['es-MX', 'en-US'].map(locale => data.translations.find(item => item.locale === locale) || empty(locale)))
    setLinks(data.socialLinks)
    setPhotoUrl(data.photoUrl || '')
    setHasData(true)
  }).catch(error => { if (error.status === 401) router.replace('/'); else setMessage(error.message) }).finally(() => setLoading(false)) }, [router])
  async function save(event) {
    event.preventDefault(); setMessage('Guardando…')
    try { await apiRequest('/v1/admin/profile', { method: 'PUT', body: JSON.stringify({ translations, socialLinks: links, photoUrl: photoUrl || null }) }); setMessage('Perfil guardado.'); setFormOpen(false) }
    catch (error) { setMessage(error.message) }
  }
  function changeTranslation(index, field, value) { setTranslations(current => current.map((item, i) => i === index ? { ...item, [field]: value } : item)) }
  function changeLink(index, field, value) { setLinks(current => current.map((item, i) => i === index ? { ...item, [field]: value } : item)) }
  return <main className={styles.dashboardPage}><section className={styles.dashboardCard}><Link href="/dashboard">← Panel</Link><h1>Perfil y redes sociales</h1>{loading ? <p>Cargando…</p> : hasData ? <><p className={styles.intro}>Edita tu presentación y enlaces en ambos idiomas. La experiencia laboral se administra en su propia sección.</p><button className={styles.primaryLink} type="button" onClick={() => { setMessage(''); setFormOpen(true) }}>Editar perfil</button><FormDialog open={formOpen} onClose={() => setFormOpen(false)} title="Editar perfil y redes">{message && <p className={styles.error} role="alert">{message}</p>}<form className={styles.createForm} onSubmit={save}>
    <ImageUpload label="Foto de perfil" value={photoUrl} onChange={setPhotoUrl} />
    {translations.map((item, i) => <fieldset key={item.locale}><legend>{item.locale}</legend><p><label>Nombre <input required maxLength={160} value={item.displayName} onChange={e => changeTranslation(i, 'displayName', e.target.value)} /></label></p><p><label>Presentación <input maxLength={255} value={item.headline} onChange={e => changeTranslation(i, 'headline', e.target.value)} /></label></p><p><label>Biografía <textarea maxLength={20000} value={item.biography} onChange={e => changeTranslation(i, 'biography', e.target.value)} /></label></p></fieldset>)}
    <h2>Redes sociales</h2>{links.map((link, i) => <div key={i}><label>Plataforma <input required maxLength={64} value={link.platform} onChange={e => changeLink(i, 'platform', e.target.value)} /></label> <label>URL <input type="url" required value={link.url} onChange={e => changeLink(i, 'url', e.target.value)} /></label> <button type="button" onClick={() => setLinks(current => current.filter((_, index) => index !== i))}>Quitar</button></div>)}<p><button type="button" onClick={() => setLinks(current => [...current, { platform: '', url: '' }])}>Agregar red</button></p><button type="submit">Guardar</button>
  </form></FormDialog></> : null}<p role="status">{message}</p></section></main>
}
