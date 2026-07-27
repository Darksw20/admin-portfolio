'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import styles from '../../../page.module.css'
import { apiRequest } from '../../../../lib/api'

const emptyForm = {
  status: 'draft', startDate: '', endDate: '', featuredOrder: '',
  titleEs: '', slugEs: '', summaryEs: '', descriptionEs: '',
  titleEn: '', slugEn: '', summaryEn: '', descriptionEn: '',
}

function formFromProject(project) {
  const es = project.translations.find((translation) => translation.locale === 'es-MX') ?? {}
  const en = project.translations.find((translation) => translation.locale === 'en-US') ?? {}
  return {
    status: project.status,
    startDate: project.startDate ?? '', endDate: project.endDate ?? '',
    featuredOrder: project.featuredOrder ?? '',
    titleEs: es.title ?? '', slugEs: es.slug ?? '', summaryEs: es.summary ?? '', descriptionEs: es.description ?? '',
    titleEn: en.title ?? '', slugEn: en.slug ?? '', summaryEn: en.summary ?? '', descriptionEn: en.description ?? '',
  }
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadProject() {
      try {
        const response = await apiRequest(`/v1/admin/projects/${projectId}`)
        setForm(formFromProject(response.project))
      } catch (requestError) {
        if (requestError.message.includes('Authentication')) router.replace('/')
        else setError(requestError.message)
      } finally {
        setIsLoading(false)
      }
    }
    if (projectId) loadProject()
  }, [projectId, router])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function saveProject(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await apiRequest(`/v1/admin/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: form.status,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          featuredOrder: form.featuredOrder === '' ? null : Number(form.featuredOrder),
          translations: [
            { locale: 'es-MX', slug: form.slugEs, title: form.titleEs, summary: form.summaryEs, description: form.descriptionEs },
            { locale: 'en-US', slug: form.slugEn, title: form.titleEn, summary: form.summaryEn, description: form.descriptionEn },
          ],
        }),
      })
      setNotice('Proyecto guardado correctamente.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className={styles.dashboardPage}>
      <section className={`${styles.dashboardCard} ${styles.projectsCard}`} aria-labelledby="edit-project-title">
        <div className={styles.dashboardHeader}>
          <div><p className={styles.eyebrow}>&gt; PROYECTO #{projectId}</p><h1 id="edit-project-title">Editar proyecto</h1></div>
          <Link className={styles.secondaryLink} href="/dashboard/projects">Volver a proyectos</Link>
        </div>
        {isLoading ? <p className={styles.intro}>Cargando proyecto…</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        {!isLoading ? <form className={styles.createForm} onSubmit={saveProject}>
          <div className={styles.projectSettings}>
            <label>Estado<select onChange={(event) => updateField('status', event.target.value)} value={form.status}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
            <label>Fecha de inicio<input onChange={(event) => updateField('startDate', event.target.value)} type="date" value={form.startDate} /></label>
            <label>Fecha de cierre<input onChange={(event) => updateField('endDate', event.target.value)} type="date" value={form.endDate} /></label>
            <label>Orden destacado<input min="0" onChange={(event) => updateField('featuredOrder', event.target.value)} type="number" value={form.featuredOrder} /></label>
          </div>
          <div className={styles.translationColumns}>
            <fieldset><legend>Español (México)</legend><input onChange={(event) => updateField('titleEs', event.target.value)} placeholder="Título" required value={form.titleEs} /><input onChange={(event) => updateField('slugEs', event.target.value)} placeholder="slug-del-proyecto" required value={form.slugEs} /><textarea onChange={(event) => updateField('summaryEs', event.target.value)} placeholder="Resumen" required value={form.summaryEs} /><textarea onChange={(event) => updateField('descriptionEs', event.target.value)} placeholder="Descripción" required value={form.descriptionEs} /></fieldset>
            <fieldset><legend>English (US)</legend><input onChange={(event) => updateField('titleEn', event.target.value)} placeholder="Title" required value={form.titleEn} /><input onChange={(event) => updateField('slugEn', event.target.value)} placeholder="project-slug" required value={form.slugEn} /><textarea onChange={(event) => updateField('summaryEn', event.target.value)} placeholder="Summary" required value={form.summaryEn} /><textarea onChange={(event) => updateField('descriptionEn', event.target.value)} placeholder="Description" required value={form.descriptionEn} /></fieldset>
          </div>
          <button disabled={isSaving} type="submit">{isSaving ? 'Guardando…' : 'Guardar cambios'}</button>
        </form> : null}
      </section>
    </main>
  )
}
