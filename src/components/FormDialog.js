'use client'
import { useEffect, useRef } from 'react'
import styles from './FormDialog.module.css'

export default function FormDialog({ open, onClose, title, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  return <dialog ref={ref} className={styles.dialog} onCancel={(event) => { event.preventDefault(); onClose() }} aria-labelledby="form-dialog-title">
    <div className={styles.header}><div><p>ADMIN / EDICIÓN</p><h2 id="form-dialog-title">{title}</h2></div><button type="button" className={styles.close} aria-label="Cerrar" onClick={onClose}>×</button></div>
    <div className={styles.body}>{children}</div>
  </dialog>
}
