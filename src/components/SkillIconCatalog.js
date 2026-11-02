'use client'
import { useEffect, useState } from 'react'
import { apiRequest } from '../lib/api'
import styles from './SkillIconCatalog.module.css'

// Only exact, unambiguous title matches are selected automatically.
export async function automaticSkillIcon(name) {
 const query=name.trim()
 if (query.length<2) return null
 const {items}=await apiRequest(`/v1/admin/skill-icons?query=${encodeURIComponent(query)}`)
 const exact=items.filter(item=>item.title.toLocaleLowerCase()===query.toLocaleLowerCase())
 if (exact.length!==1) return null
 const result=await apiRequest('/v1/admin/skill-icons',{method:'POST',body:JSON.stringify({slug:exact[0].slug})})
 return result.url
}
export default function SkillIconCatalog({onChange}) {
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[items,setItems]=useState([]),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{ if(!open || query.trim().length<2){setItems([]);return} let active=true;const timer=setTimeout(async()=>{setLoading(true);setError('');try{const response=await apiRequest(`/v1/admin/skill-icons?query=${encodeURIComponent(query.trim())}`);if(active)setItems(response.items)}catch(e){if(active)setError(e.message)}finally{if(active)setLoading(false)}},250);return()=>{active=false;clearTimeout(timer)} },[query,open])
 async function choose(item){setBusy(true);setError('');try{const result=await apiRequest('/v1/admin/skill-icons',{method:'POST',body:JSON.stringify({slug:item.slug})});onChange(result.url);setOpen(false)}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section className={styles.catalog}><button type="button" onClick={()=>setOpen(!open)} aria-expanded={open}>{open?'Cerrar catálogo':'Elegir icono del catálogo'}</button>{open&&<div><p>Busca una tecnología. El icono seleccionado se guarda en Blob. Las marcas pertenecen a sus respectivos titulares.</p><input aria-label="Buscar en catálogo de iconos" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar tecnología" />{loading&&<p role="status">Buscando…</p>}{error&&<p role="alert">{error}</p>}{!loading&&query.trim().length>=2&&!items.length&&!error&&<p>Sin coincidencias.</p>}<div className={styles.grid}>{items.map(item=><button type="button" disabled={busy} key={item.slug} onClick={()=>choose(item)} title={item.title}><img src={`data:image/svg+xml,${encodeURIComponent(item.svg)}`} alt="" /><span>{item.title}</span></button>)}</div></div>}</section>
}
