'use client'
import styles from '../app/page.module.css'
function slugify(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
export default function SkillAreas({ areas, onChange }) {
  return <fieldset className={styles.areaFields}><legend>Áreas de desarrollo</legend><p>Usa el mismo nombre para agrupar habilidades en el filtro público.</p>{areas.map((area, index) => <div key={index} className={styles.translationColumns}>
    <label className={styles.fullField}>Español<input required maxLength={96} value={area.es} onChange={event => { const es = event.target.value; onChange(areas.map((item, i) => i === index ? { ...item, es, slug: slugify(es) } : item)) }} /></label>
    <label className={styles.fullField}>English<input required maxLength={96} value={area.en} onChange={event => onChange(areas.map((item, i) => i === index ? { ...item, en: event.target.value } : item))} /></label>
    <button type="button" onClick={() => onChange(areas.filter((_, i) => i !== index))}>Quitar área</button>
  </div>)}<button type="button" onClick={() => onChange([...areas, { slug: '', es: '', en: '' }])}>Agregar área</button></fieldset>
}
