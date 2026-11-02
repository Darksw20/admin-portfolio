'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../../page.module.css'
import { apiRequest } from '../../../lib/api'
import FormDialog from '../../../components/FormDialog'
import SkillPicker from '../../../components/SkillPicker'

const emptyForm = {
  skillIds: [], titleEs: '', slugEs: '', summaryEs: '', descriptionEs: '',
  titleEn: '', slugEn: '', summaryEn: '', descriptionEn: '',
}

function slugify(value) {
  return value
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function ProjectsPage() {
  const [slugTouched, setSlugTouched] = useState({ es: false, en: false })
  const [formOpen, setFormOpen] = useState(false)
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const parameters = new URLSearchParams({ page: '1', pageSize: '20' })
      if (query.trim()) parameters.set('query', query.trim())
      if (status) parameters.set('status', status)
      const response = await apiRequest(`/v1/admin/projects?${parameters}`)
      setProjects(response.items)
    } catch (requestError) {
      if (requestError.status === 401) router.replace('/')
      else setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }, [query, router, status])

  useEffect(() => { loadProjects() }, [loadProjects])

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value }
      if (field === 'titleEs' && !slugTouched.es) next.slugEs = slugify(value)
      if (field === 'titleEn' && !slugTouched.en) next.slugEn = slugify(value)
      return next
    })
  }

  async function createProject(event) {
    event.preventDefault()
    setIsCreating(true)
    setError('')
    try {
      await apiRequest('/v1/admin/projects', {
        method: 'POST',
        body: JSON.stringify({
          status: 'draft',
          skillIds: form.skillIds,
          translations: [
            { locale: 'es-MX', slug: form.slugEs, title: form.titleEs, summary: form.summaryEs, description: form.descriptionEs },
            { locale: 'en-US', slug: form.slugEn, title: form.titleEn, summary: form.summaryEn, description: form.descriptionEn },
          ],
        }),
      })
      setForm(emptyForm)
      setSlugTouched({ es: false, en: false })
      setFormOpen(false)
      await loadProjects()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <main className={styles.dashboardPage}>
      <section className={`${styles.dashboardCard} ${styles.projectsCard}`} aria-labelledby="projects-title">
        <div className={styles.dashboardHeader}>
          <div>
            <p className={styles.eyebrow}>&gt; PROYECTOS</p>
            <h1 id="projects-title">Gestionar proyectos</h1>
          </div>
          <Link className={styles.secondaryLink} href="/dashboard">Volver al dashboard</Link>
        </div>

        <div className={styles.filters}>
          <input aria-label="Buscar proyecto" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título o slug" value={query} />
          <select aria-label="Filtrar por estado" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
          <button onClick={loadProjects} type="button">Filtrar</button>
        </div>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <div className={styles.projectList} aria-live="polite">
          {isLoading ? <p>Cargando proyectos…</p> : null}
          {!isLoading && !projects.length ? <p>No hay proyectos que coincidan.</p> : null}
          {projects.map((project) => (
            <article className={styles.projectRow} key={project.id}>
              <div><strong>{project.title ?? 'Sin traducción en español'}</strong><span>/{project.slug ?? 'sin-slug'}</span></div>
              <div className={styles.rowActions}>
                <span className={styles.status}>{project.status}</span>
                <Link className={styles.editLink} href={`/dashboard/projects/${project.id}`}>Editar</Link>
              </div>
            </article>
          ))}
        </div>

        <button className={styles.primaryLink} type="button" onClick={() => { setError(''); setFormOpen(true) }}>+ Nuevo proyecto</button><FormDialog open={formOpen} onClose={() => setFormOpen(false)} title="Agregar proyecto">{error ? <p className={styles.error} role="alert">{error}</p> : null}<form className={styles.createForm} onSubmit={createProject}>
          <h2>Agregar proyecto como borrador</h2>
          <SkillPicker selected={form.skillIds} onChange={value => updateField('skillIds', value)} />
          <div className={styles.translationColumns}>
            <fieldset>
              <legend>Español (México)</legend>
              <input onChange={(event) => updateField('titleEs', event.target.value)} placeholder="Título" required value={form.titleEs} />
              <input onChange={(event) => { setSlugTouched(current => ({ ...current, es: true })); updateField('slugEs', slugify(event.target.value)) }} placeholder="slug-del-proyecto" required value={form.slugEs} />
              <textarea onChange={(event) => updateField('summaryEs', event.target.value)} placeholder="Resumen" required value={form.summaryEs} />
              <textarea onChange={(event) => updateField('descriptionEs', event.target.value)} placeholder="Descripción" required value={form.descriptionEs} />
            </fieldset>
            <fieldset>
              <legend>English (US)</legend>
              <input onChange={(event) => updateField('titleEn', event.target.value)} placeholder="Title" required value={form.titleEn} />
              <input onChange={(event) => { setSlugTouched(current => ({ ...current, en: true })); updateField('slugEn', slugify(event.target.value)) }} placeholder="project-slug" required value={form.slugEn} />
              <textarea onChange={(event) => updateField('summaryEn', event.target.value)} placeholder="Summary" required value={form.summaryEn} />
              <textarea onChange={(event) => updateField('descriptionEn', event.target.value)} placeholder="Description" required value={form.descriptionEn} />
            </fieldset>
          </div>
          <button disabled={isCreating} type="submit">{isCreating ? 'Guardando…' : 'Guardar borrador'}</button>
        </form></FormDialog>
      </section>
    </main>
  )
}
