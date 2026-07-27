'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import styles from '../../../page.module.css'
import { apiRequest } from '../../../../lib/api'

const groupLabels = { soft_skill: 'Habilidad personal', programming_language: 'Lenguaje', tool: 'Herramienta', spoken_language: 'Idioma' }
const emptyForm = { status: 'draft', group: 'tool', proficiency: '0', displayOrder: '0', nameEs: '', descriptionEs: '', nameEn: '', descriptionEn: '' }

function formFromSkill(skill) {
  const es = skill.translations.find((translation) => translation.locale === 'es-MX') ?? {}
  const en = skill.translations.find((translation) => translation.locale === 'en-US') ?? {}
  return { status: skill.status, group: skill.group, proficiency: String(skill.proficiency), displayOrder: String(skill.displayOrder), nameEs: es.name ?? '', descriptionEs: es.description ?? '', nameEn: en.name ?? '', descriptionEn: en.description ?? '' }
}

export default function EditSkillPage() {
  const params = useParams(); const router = useRouter()
  const skillId = Array.isArray(params.id) ? params.id[0] : params.id
  const [form, setForm] = useState(emptyForm); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [isLoading, setIsLoading] = useState(true); const [isSaving, setIsSaving] = useState(false)
  useEffect(() => {
    async function loadSkill() {
      try { const response = await apiRequest(`/v1/admin/skills/${skillId}`); setForm(formFromSkill(response.skill)) }
      catch (requestError) { if (requestError.message.includes('Authentication')) router.replace('/'); else setError(requestError.message) }
      finally { setIsLoading(false) }
    }
    if (skillId) loadSkill()
  }, [router, skillId])
  function updateField(field, value) { setForm((current) => ({ ...current, [field]: value })) }
  async function saveSkill(event) {
    event.preventDefault(); setError(''); setNotice(''); setIsSaving(true)
    try {
      await apiRequest(`/v1/admin/skills/${skillId}`, { method: 'PATCH', body: JSON.stringify({ status: form.status, group: form.group, proficiency: Number(form.proficiency), displayOrder: Number(form.displayOrder), translations: [{ locale: 'es-MX', name: form.nameEs, description: form.descriptionEs || null }, { locale: 'en-US', name: form.nameEn, description: form.descriptionEn || null }] }) })
      setNotice('Habilidad guardada correctamente.')
    } catch (requestError) { setError(requestError.message) } finally { setIsSaving(false) }
  }
  return <main className={styles.dashboardPage}><section className={`${styles.dashboardCard} ${styles.projectsCard}`} aria-labelledby="edit-skill-title"><div className={styles.dashboardHeader}><div><p className={styles.eyebrow}>&gt; HABILIDAD #{skillId}</p><h1 id="edit-skill-title">Editar habilidad</h1></div><Link className={styles.secondaryLink} href="/dashboard/skills">Volver a habilidades</Link></div>{isLoading ? <p className={styles.intro}>Cargando habilidad…</p> : null}{error ? <p className={styles.error} role="alert">{error}</p> : null}{notice ? <p className={styles.notice} role="status">{notice}</p> : null}{!isLoading ? <form className={styles.createForm} onSubmit={saveSkill}><div className={styles.projectSettings}><label>Estado<select onChange={(event) => updateField('status', event.target.value)} value={form.status}><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label><label>Grupo<select onChange={(event) => updateField('group', event.target.value)} value={form.group}>{Object.entries(groupLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Valoración (0-100)<input max="100" min="0" onChange={(event) => updateField('proficiency', event.target.value)} required type="number" value={form.proficiency} /></label><label>Orden<input min="0" onChange={(event) => updateField('displayOrder', event.target.value)} required type="number" value={form.displayOrder} /></label></div><div className={styles.translationColumns}><fieldset><legend>Español (México)</legend><input onChange={(event) => updateField('nameEs', event.target.value)} placeholder="Nombre" required value={form.nameEs} /><textarea onChange={(event) => updateField('descriptionEs', event.target.value)} placeholder="Descripción opcional" value={form.descriptionEs} /></fieldset><fieldset><legend>English (US)</legend><input onChange={(event) => updateField('nameEn', event.target.value)} placeholder="Name" required value={form.nameEn} /><textarea onChange={(event) => updateField('descriptionEn', event.target.value)} placeholder="Optional description" value={form.descriptionEn} /></fieldset></div><button disabled={isSaving} type="submit">{isSaving ? 'Guardando…' : 'Guardar cambios'}</button></form> : null}</section></main>
}
