'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../../page.module.css'
import { apiRequest } from '../../../lib/api'

const emptyForm = { group: 'tool', proficiency: '50', displayOrder: '0', nameEs: '', descriptionEs: '', nameEn: '', descriptionEn: '' }
const groupLabels = { soft_skill: 'Habilidad personal', programming_language: 'Lenguaje', tool: 'Herramienta', spoken_language: 'Idioma' }

export default function SkillsPage() {
  const router = useRouter()
  const [skills, setSkills] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [group, setGroup] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const loadSkills = useCallback(async () => {
    setIsLoading(true); setError('')
    try {
      const parameters = new URLSearchParams({ page: '1', pageSize: '20' })
      if (query.trim()) parameters.set('query', query.trim())
      if (status) parameters.set('status', status)
      if (group) parameters.set('group', group)
      const response = await apiRequest(`/v1/admin/skills?${parameters}`)
      setSkills(response.items)
    } catch (requestError) {
      if (requestError.message.includes('Authentication')) router.replace('/')
      else setError(requestError.message)
    } finally { setIsLoading(false) }
  }, [group, query, router, status])

  useEffect(() => { loadSkills() }, [loadSkills])
  function updateField(field, value) { setForm((current) => ({ ...current, [field]: value })) }

  async function createSkill(event) {
    event.preventDefault(); setIsCreating(true); setError('')
    try {
      await apiRequest('/v1/admin/skills', { method: 'POST', body: JSON.stringify({
        status: 'draft', group: form.group, proficiency: Number(form.proficiency), displayOrder: Number(form.displayOrder),
        translations: [{ locale: 'es-MX', name: form.nameEs, description: form.descriptionEs || null }, { locale: 'en-US', name: form.nameEn, description: form.descriptionEn || null }],
      }) })
      setForm(emptyForm); await loadSkills()
    } catch (requestError) { setError(requestError.message) } finally { setIsCreating(false) }
  }

  return <main className={styles.dashboardPage}><section className={`${styles.dashboardCard} ${styles.projectsCard}`} aria-labelledby="skills-title">
    <div className={styles.dashboardHeader}><div><p className={styles.eyebrow}>&gt; HABILIDADES</p><h1 id="skills-title">Gestionar habilidades</h1></div><Link className={styles.secondaryLink} href="/dashboard">Volver al dashboard</Link></div>
    <div className={styles.filters}><input aria-label="Buscar habilidad" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre" value={query} /><select aria-label="Filtrar por estado" onChange={(event) => setStatus(event.target.value)} value={status}><option value="">Todos los estados</option><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select><select aria-label="Filtrar por grupo" onChange={(event) => setGroup(event.target.value)} value={group}><option value="">Todos los grupos</option>{Object.entries(groupLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button onClick={loadSkills} type="button">Filtrar</button></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    <div className={styles.projectList} aria-live="polite">{isLoading ? <p>Cargando habilidades…</p> : null}{!isLoading && !skills.length ? <p>No hay habilidades que coincidan.</p> : null}{skills.map((skill) => <article className={styles.projectRow} key={skill.id}><div><strong>{skill.name ?? 'Sin traducción en español'}</strong><span>{groupLabels[skill.group]} · {skill.proficiency}%</span></div><div className={styles.rowActions}><span className={styles.status}>{skill.status}</span><Link className={styles.editLink} href={`/dashboard/skills/${skill.id}`}>Editar</Link></div></article>)}</div>
    <form className={styles.createForm} onSubmit={createSkill}><h2>Agregar habilidad como borrador</h2><div className={styles.projectSettings}><label>Grupo<select onChange={(event) => updateField('group', event.target.value)} value={form.group}>{Object.entries(groupLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Valoración (0-100)<input max="100" min="0" onChange={(event) => updateField('proficiency', event.target.value)} required type="number" value={form.proficiency} /></label><label>Orden<input min="0" onChange={(event) => updateField('displayOrder', event.target.value)} required type="number" value={form.displayOrder} /></label></div><div className={styles.translationColumns}><fieldset><legend>Español (México)</legend><input onChange={(event) => updateField('nameEs', event.target.value)} placeholder="Nombre" required value={form.nameEs} /><textarea onChange={(event) => updateField('descriptionEs', event.target.value)} placeholder="Descripción opcional" value={form.descriptionEs} /></fieldset><fieldset><legend>English (US)</legend><input onChange={(event) => updateField('nameEn', event.target.value)} placeholder="Name" required value={form.nameEn} /><textarea onChange={(event) => updateField('descriptionEn', event.target.value)} placeholder="Optional description" value={form.descriptionEn} /></fieldset></div><button disabled={isCreating} type="submit">{isCreating ? 'Guardando…' : 'Guardar borrador'}</button></form>
  </section></main>
}
