const MAX_BYTES = 10 * 1024 * 1024
export async function extractResume(file) {
 if(!file)throw new Error('Selecciona un archivo PDF o DOCX.')
 if(file.size > MAX_BYTES)throw new Error('El archivo debe pesar menos de 10 MB.')
 const name=file.name.toLowerCase()
 if(name.endsWith('.docx')) {
  const imported=await import('mammoth/mammoth.browser')
  const mammoth=imported.default || imported
  const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()})
  return {format:'docx',pageCount:null,text:result.value.trim(),warnings:result.messages.map(message=>message.message)}
 }
 if(!name.endsWith('.pdf') && file.type!=='application/pdf')throw new Error('Selecciona un archivo PDF o DOCX.')
 const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs')
 pdfjs.GlobalWorkerOptions.workerSrc='/pdfjs/pdf.worker.min.mjs'
 const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false})
 try {
  const pdf=await task.promise
  if(pdf.numPages>20)throw new Error('El análisis admite hasta 20 páginas.')
  const pages=[]
  for(let i=1;i<=pdf.numPages;i++){
   const page=await pdf.getPage(i),content=await page.getTextContent();let text='',lastY=null,afterBreak=false
   for(const item of content.items){if(typeof item.str!=='string')continue;const y=item.transform?.[5];if(text&&!afterBreak&&lastY!==null&&typeof y==='number'&&Math.abs(lastY-y)>Math.max(3,(item.height||0)*.55))text+='\n';if(item.str){if(text&&!text.endsWith('\n')&&!text.endsWith(' '))text+=' ';text+=item.str}afterBreak=!!item.hasEOL;if(afterBreak&&!text.endsWith('\n'))text+='\n';if(typeof y==='number')lastY=y}
   pages.push(text.trim())
  }
  return {format:'pdf',pageCount:pdf.numPages,text:pages.join('\n\n'),warnings:[]}
 } finally {await task.destroy()}
}
