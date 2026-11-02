'use client'
import ImageUpload from '../../../../components/ImageUpload'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import styles from '../../../page.module.css'
import { apiRequest } from '../../../../lib/api'
import FormDialog from '../../../../components/FormDialog'
import SkillPicker from '../../../../components/SkillPicker'

const emptyForm = {
  skillIds: [], status: 'draft', startDate: '', endDate: '', featuredOrder: '', githubUrl: '', websiteUrl: '', coverImageUrl: '', galleryImageUrls: '',
  developmentAreas: [],
  titleEs: '', slugEs: '', summaryEs: '', descriptionEs: '',
  titleEn: '', slugEn: '', summaryEn: '', descriptionEn: '',
}

function formFromProject(project) {
  const es = project.translations.find((translation) => translation.locale === 'es-MX') ?? {}
  const en = project.translations.find((translation) => translation.locale === 'en-US') ?? {}
  return {
    skillIds: project.skillIds ?? [],
    status: project.status,
    startDate: project.startDate ?? '', endDate: project.endDate ?? '',
    featuredOrder: project.featuredOrder ?? '',
    developmentAreas: project.developmentAreas ?? [],
    githubUrl: project.githubUrl ?? '', websiteUrl: project.websiteUrl ?? '', coverImageUrl: project.coverImageUrl ?? '', galleryImageUrls: (project.galleryImageUrls ?? []).join('\n'),
    titleEs: es.title ?? '', slugEs: es.slug ?? '', summaryEs: es.summary ?? '', descriptionEs: es.description ?? '',
    titleEn: en.title ?? '', slugEn: en.slug ?? '', summaryEn: en.summary ?? '', descriptionEn: en.description ?? '',
  }
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id
  const [hasData, setHasData] = useState(false)
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
        setHasData(true)
      } catch (requestError) {
        if (requestError.status === 401) router.replace('/')
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
          skillIds: form.skillIds,
          status: form.status,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          featuredOrder: form.featuredOrder === '' ? null : Number(form.featuredOrder),
          developmentAreas: form.developmentAreas,
          githubUrl: form.githubUrl.trim() || null, websiteUrl: form.websiteUrl.trim() || null, coverImageUrl: form.coverImageUrl.trim() || null, galleryImageUrls: form.galleryImageUrls.split('\n').map(url => url.trim()).filter(Boolean),
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
        {!isLoading && hasData ? <FormDialog open={true} onClose={() => router.push('/dashboard/projects')} title="Editar proyecto">{error ? <p className={styles.error} role="alert">{error}</p> : null}{notice ? <p className={styles.notice} role="status">{notice}</p> : null}<form className={styles.createForm} onSubmit={saveProject}>
          <div className={styles.projectSettings}>
            <label>Estado<select onChange={(event) => updateField('status', event.target.value)} value={form.status}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label>
            <label>Fecha de inicio<input onChange={(event) => updateField('startDate', event.target.value)} type="date" value={form.startDate} /></label>
            <label>Fecha de cierre<input onChange={(event) => updateField('endDate', event.target.value)} type="date" value={form.endDate} /></label>
            <label>Orden destacado<input min="0" onChange={(event) => updateField('featuredOrder', event.target.value)} type="number" value={form.featuredOrder} /></label>
          </div>
          <fieldset className={styles.createForm}><legend>Áreas de desarrollo</legend>
            <p>Usa el mismo nombre en proyectos de la misma área.</p>
            {form.developmentAreas.map((area, index) => <div key={index} className={styles.translationColumns}>
              <label className={styles.fullField}>Español<input required maxLength={96} value={area.es} onChange={event => {
                const es = event.target.value
                const slug = es.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                updateField('developmentAreas', form.developmentAreas.map((item, i) => i === index ? { ...item, es, slug } : item))
              }} /></label>
              <label className={styles.fullField}>English<input required maxLength={96} value={area.en} onChange={event => updateField('developmentAreas', form.developmentAreas.map((item, i) => i === index ? { ...item, en: event.target.value } : item))} /></label>
              <button type="button" onClick={() => updateField('developmentAreas', form.developmentAreas.filter((_, i) => i !== index))}>Quitar área</button>
            </div>)}
            <button type="button" onClick={() => updateField('developmentAreas', [...form.developmentAreas, { slug: '', es: '', en: '' }])}>Agregar área</button>
          </fieldset>
          <SkillPicker selected={form.skillIds} onChange={value => updateField('skillIds', value)} />
          <label className={styles.fullField}>URL de GitHub (opcional)<input type="url" value={form.githubUrl} onChange={event => updateField('githubUrl', event.target.value)} /></label>
          <label className={styles.fullField}>URL del proyecto (opcional)<input type="url" value={form.websiteUrl} onChange={event => updateField('websiteUrl', event.target.value)} /></label>
          <ImageUpload label="Imagen principal" value={form.coverImageUrl} onChange={value => updateField('coverImageUrl', value)} />
          <ImageUpload label="Imágenes de galería" multiple value={form.galleryImageUrls} onChange={value => updateField('galleryImageUrls', value)} />
          <div className={styles.translationColumns}>
            <fieldset><legend>Español (México)</legend><input onChange={(event) => updateField('titleEs', event.target.value)} placeholder="Título" required value={form.titleEs} /><input onChange={(event) => updateField('slugEs', event.target.value)} placeholder="slug-del-proyecto" required value={form.slugEs} /><textarea onChange={(event) => updateField('summaryEs', event.target.value)} placeholder="Resumen" required value={form.summaryEs} /><textarea onChange={(event) => updateField('descriptionEs', event.target.value)} placeholder="Descripción" required value={form.descriptionEs} /></fieldset>
            <fieldset><legend>English (US)</legend><input onChange={(event) => updateField('titleEn', event.target.value)} placeholder="Title" required value={form.titleEn} /><input onChange={(event) => updateField('slugEn', event.target.value)} placeholder="project-slug" required value={form.slugEn} /><textarea onChange={(event) => updateField('summaryEn', event.target.value)} placeholder="Summary" required value={form.summaryEn} /><textarea onChange={(event) => updateField('descriptionEn', event.target.value)} placeholder="Description" required value={form.descriptionEn} /></fieldset>
          </div>
          <button disabled={isSaving} type="submit">{isSaving ? 'Guardando…' : 'Guardar cambios'}</button>
        </form></FormDialog> : null}
      </section>
    </main>
  )
}
