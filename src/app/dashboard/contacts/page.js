'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../../page.module.css'
import { apiRequest } from '../../../lib/api'
export default function ContactsPage() {
  const router = useRouter(); const [items, setItems] = useState([]); const [status, setStatus] = useState('new'); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { const params = new URLSearchParams({ page: '1', pageSize: '30' }); if (status) params.set('status', status); setItems((await apiRequest(`/v1/admin/contacts?${params}`)).items) } catch (err) { if (err.status === 401) router.replace('/'); else setError(err.message) } finally { setLoading(false) } }, [router, status])
  useEffect(() => { load() }, [load])
  async function decide(id, nextStatus) { setError(''); try { await apiRequest(`/v1/admin/contacts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }); await load() } catch (err) { setError(err.message) } }
  return <main className={styles.dashboardPage}><section className={`${styles.dashboardCard} ${styles.projectsCard}`}><div className={styles.dashboardHeader}><div><p className={styles.eyebrow}>&gt; CONTACTOS</p><h1>Bandeja de contacto</h1></div><Link className={styles.secondaryLink} href="/dashboard">Volver al dashboard</Link></div><div className={styles.filters}><select onChange={(event) => setStatus(event.target.value)} value={status}><option value="">Todos</option><option value="new">Nuevos</option><option value="approved">Aprobados</option><option value="rejected">Rechazados</option><option value="replied">Respondidos</option></select><button onClick={load} type="button">Filtrar</button></div>{error ? <p className={styles.error}>{error}</p> : null}<div className={styles.projectList}>{loading ? <p>Cargando contactos…</p> : null}{!loading && !items.length ? <p>No hay contactos.</p> : null}{items.map((item) => <article className={styles.contactRow} key={item.id}><div><strong>{item.name} · {item.email}</strong><span>{item.subject || 'Sin asunto'} · {item.status}</span><p>{item.message}</p></div>{item.status === 'new' ? <div className={styles.rowActions}><button onClick={() => decide(item.id, 'approved')} type="button">Aprobar</button><button className={styles.rejectButton} onClick={() => decide(item.id, 'rejected')} type="button">Rechazar</button></div> : null}</article>)}</div></section></main>
}
