export async function inspectPdf(file, keywords) {
 if(file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Selecciona un archivo PDF.')
 if(file.size > 10 * 1024 * 1024) throw new Error('El archivo debe pesar menos de 10 MB.')
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs')
 pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false})
 let pdf
 try { pdf=await task.promise; if(pdf.numPages>20)throw new Error('El análisis admite hasta 20 páginas.')
  const pages=[]
  for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const text=await page.getTextContent();pages.push(text.items.map(item => `${item.str || ''}${item.hasEOL?'\n':' '}`).join('').trim())}
  const text=pages.join('\n\n'), normal=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  const wanted=[...new Set(keywords.split(/[,\n]/).map(x=>x.trim()).filter(Boolean))].slice(0,50)
  const checks=[
   {label:'Texto seleccionable',ok:text.replace(/\s/g,'').length>=50,detail:text.replace(/\s/g,'').length>=50?'Se extrajo texto del documento.':'Se extrajo poco texto. Puede ser una imagen o tener una codificación problemática.'},
   {label:'Extensión',ok:pdf.numPages===1,detail:`${pdf.numPages} ${pdf.numPages===1?'página':'páginas'}. El objetivo de este constructor es una página.`},
   {label:'Correo reconocible',ok:/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text),detail:'Busca una dirección de correo en el texto extraído.'},
   {label:'Sección de experiencia reconocible',ok:/\b(experience|experiencia|employment|trayectoria)\b/.test(normal),detail:'Busca un encabezado común; otros nombres también pueden ser válidos.'},
   {label:'Sección de formación reconocible',ok:/\b(education|educacion|formacion|estudios)\b/.test(normal),detail:'Busca un encabezado común; otros nombres también pueden ser válidos.'},
   {label:'Caracteres de reemplazo',ok:!text.includes('\ufffd'),detail:'Revisa si el texto contiene caracteres que no pudieron decodificarse.'},
  ]
  return {pages:pdf.numPages,text,checks,keywords:wanted.map(word=>({word,found:normal.includes(word.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())}))}
 } finally { await task.destroy() }
}
