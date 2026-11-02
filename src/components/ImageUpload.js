'use client'
/* eslint-disable @next/next/no-img-element -- Blob library previews use user-selected URLs. */
import { useEffect, useRef, useState } from 'react'
import { put } from '@vercel/blob/client'
import { apiRequest } from '../lib/api'
import styles from './ImageUpload.module.css'
const accepted=['image/jpeg','image/png','image/webp','image/gif']
export default function ImageUpload({label,value,onChange,multiple=false}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[library,setLibrary]=useState(false),[items,setItems]=useState([]),[cursor,setCursor]=useState(null),[hasMore,setHasMore]=useState(false),[loading,setLoading]=useState(false),[search,setSearch]=useState(''),[dragging,setDragging]=useState(false)
 const input=useRef(null), current=useRef(value); current.current=value
 useEffect(()=>{if(!busy)return;const form=input.current?.closest('form');if(!form)return;const preventSave=event=>{event.preventDefault();event.stopImmediatePropagation();setError('Espera a que termine la carga antes de guardar.')};form.addEventListener('submit',preventSave,true);return()=>form.removeEventListener('submit',preventSave,true)},[busy])
 const selected=multiple?value.split('\n').map(x=>x.trim()).filter(Boolean):value?[value]:[]
 function setUrls(urls) {const next=multiple?[...new Set(urls)].join('\n'):(urls[0]||'');current.current=next;onChange(next)}
 function add(url) { const currentUrls=multiple?current.current.split('\n').map(x=>x.trim()).filter(Boolean):[];setUrls(multiple?[...currentUrls,url]:[url]) }
 async function upload(files) {
  files=Array.from(files);if(!files.length||busy)return
  setBusy(true);setError('')
  try {for(const file of multiple?files:files.slice(0,1)) {
   if(!accepted.includes(file.type)||file.size>10*1024*1024||file.size===0) throw new Error(`${file.name}: usa JPG, PNG, WebP o GIF de hasta 10 MB.`)
   const {token,pathname}=await apiRequest('/v1/admin/image-upload',{method:'POST',body:JSON.stringify({type:file.type,size:file.size,name:file.name})})
   const blob=await put(pathname,file,{access:'public',token,contentType:file.type});add(blob.url);setItems(prev=>[{url:blob.url,pathname},...prev.filter(item=>item.url!==blob.url)])
  }}catch(e){setError(e.message||'No fue posible subir la imagen.')}finally{setBusy(false);if(input.current)input.current.value=''}
 }
 async function load(next) {setLoading(true);setError('');try{const data=await apiRequest('/v1/admin/image-upload'+(next?`?cursor=${encodeURIComponent(next)}`:''));setItems(prev=>next?[...prev,...data.items.filter(item=>!prev.some(existing=>existing.url===item.url))]:data.items);setCursor(data.cursor||null);setHasMore(data.hasMore)}catch(e){setError(e.message)}finally{setLoading(false)}}
 function toggleLibrary(){if(!library)load();setLibrary(!library)}
 function select(url){if(multiple){if(selected.includes(url))setUrls(selected.filter(x=>x!==url));else add(url)}else{add(url);setLibrary(false)}}
 return <section className={styles.root} onPaste={event=>{const files=Array.from(event.clipboardData.files);if(files.length){event.preventDefault();upload(files)}}}>
  <span className={styles.label}>{label}</span>
  {selected.length>0&&<div className={styles.selected}>{selected.map((url,i)=><div className={styles.selectedItem} key={`${url}-${i}`}><img src={url} alt="" /><div className={styles.actions}>{multiple&&i>0&&<button type="button" aria-label="Mover imagen hacia arriba" onClick={()=>{const copy=[...selected];[copy[i-1],copy[i]]=[copy[i],copy[i-1]];setUrls(copy)}}>↑</button>}<button type="button" aria-label="Quitar imagen" onClick={()=>setUrls(selected.filter((_,index)=>index!==i))}>×</button></div></div>)}</div>}
  <div className={`${styles.drop} ${dragging?styles.dragging:''}`} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);upload(e.dataTransfer.files)}}>
   <strong>{busy?'Subiendo imagen…':'Arrastra imágenes aquí'}</strong><span>o pégalas desde el portapapeles</span><div className={styles.buttons}><button type="button" disabled={busy} onClick={()=>input.current?.click()}>Subir desde mi equipo</button><button type="button" disabled={busy} onClick={toggleLibrary} aria-expanded={library}>{library?'Cerrar biblioteca':'Elegir de biblioteca'}</button></div><input ref={input} className={styles.file} type="file" accept={accepted.join(',')} multiple={multiple} onChange={e=>upload(e.target.files)} /><small>JPG, PNG, WebP o GIF · máximo 10 MB por imagen</small>
  </div>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  {library&&<div className={styles.library}><div className={styles.libraryHeader}><strong>Biblioteca de imágenes</strong><input aria-label="Buscar en imágenes cargadas" placeholder="Buscar en imágenes cargadas" value={search} onChange={e=>setSearch(e.target.value)} /></div><div className={styles.grid}>{items.filter(item=>item.pathname.toLowerCase().includes(search.toLowerCase())).map(item=><button key={item.url} type="button" className={`${styles.tile} ${selected.includes(item.url)?styles.active:''}`} onClick={()=>select(item.url)} aria-pressed={selected.includes(item.url)} title={item.pathname}><img src={item.url} alt="" loading="lazy" /><span>{item.pathname.split('/').pop().replace(/^[0-9a-f-]{36}-/,'')}</span></button>)}</div>{!loading&&!items.length&&<p>No hay imágenes en la biblioteca.</p>}{loading&&<p role="status">Cargando imágenes…</p>}{hasMore&&<button type="button" disabled={loading} onClick={()=>load(cursor)}>Cargar más imágenes</button>}</div>}
 </section>
}
