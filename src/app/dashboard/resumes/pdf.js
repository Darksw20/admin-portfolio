import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const labels = {
  'en-US': {summary:'Profile',experience:'Experience',education:'Education',projects:'Projects',hardSkills:'Technical skills',softSkills:'Soft skills',languages:'Languages',contact:'Contact'},
  'es-MX': {summary:'Perfil',experience:'Experiencia',education:'Formación',projects:'Proyectos',hardSkills:'Habilidades técnicas',softSkills:'Habilidades personales',languages:'Idiomas',contact:'Contacto'},
}
const clean = value => {
  const text=String(value || '').replace(/\r/g,'').replace(/[\u2010-\u2011\u2012]/g,'-').replace(/[\u2022\u25cf]/g,'•')
  if (/[^\x09\x0A\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u20AC]/.test(text)) throw new Error('El CV contiene caracteres que esta tipografía no admite. Sustituye los símbolos especiales antes de exportar.')
  return text
}
function wrap(text,font,size,width) {
  const lines=[]
  for(const para of clean(text).split('\n')) {
    if(!para.trim()){lines.push('');continue}
    let line=''
    for(const word of para.trim().split(/\s+/)) {
      let part=word
      while(part && font.widthOfTextAtSize(part,size)>width) {
        let n=1;while(n<part.length && font.widthOfTextAtSize(part.slice(0,n+1),size)<=width)n++
        if(line){lines.push(line);line=''} lines.push(part.slice(0,n));part=part.slice(n)
      }
      if(!part)continue
      const next=line?`${line} ${part}`:part
      if(line && font.widthOfTextAtSize(next,size)>width){lines.push(line);line=part}else line=next
    }
    if(line)lines.push(line)
  }
  return lines
}
function build(doc, page, fonts, resume, size, draw) {
 const {regular,bold}=fonts, c=resume.content, l=labels[resume.locale] || labels['en-US'], template=resume.template, ink=rgb(.10,.11,.10), accent=template==='modern'?rgb(.25,.33,.20):rgb(.16,.16,.16)
 const width=612,height=792,margin=30, line=size*1.23
 const print=(text,x,y,font,fontSize,color=ink)=>{if(draw && text)page.drawText(clean(text),{x,y,size:fontSize,font,color})}
 const lineAt=(x,y,w)=>{if(draw)page.drawLine({start:{x,y},end:{x:x+w,y},thickness:.55,color:accent})}
 function column(x,top,w) {
  let y=top
  function text(value, options={}) { if(!value)return;const font=options.bold?bold:regular,s=options.size||size;for(const valueLine of wrap(value,font,s,w)){y-=s*1.23;print(valueLine,x,y,font,s,options.accent?accent:ink)}if(options.after)y-=options.after }
  function heading(value){y-=size*.75;text(value.toUpperCase(),{bold:true,size:size*1.03,accent:true});lineAt(x,y-2,w);y-=size*.45}
  function entries(title,items){const chosen=items.filter(item=>item.selected && (item.title||item.organization||item.details));if(!chosen.length)return;heading(title);for(const entry of chosen){text([entry.title,entry.organization].filter(Boolean).join(' | '),{bold:true});text(entry.dates,{size:size*.92});text(entry.details,{after:size*.5})}}
  return {text,heading,entries,get y(){return y}}
 }
 const name=clean(c.name)||' ';const nameSize=Math.min(20,size*1.9);const contact=[c.email,c.phone,c.location].filter(Boolean).join('  |  ')
 if(template==='original') {
  const header=column(margin,height-margin,width-2*margin); header.text(name,{bold:true,size:nameSize}); if(draw)lineAt(margin,header.y-6,width-2*margin)
  const left=column(margin,header.y-15,155), right=column(margin+175,header.y-15,width-2*margin-175)
  if(c.headline)left.text(c.headline,{bold:true});if(contact||c.links){left.heading(l.contact);left.text(contact);left.text(c.links)}
  if(c.summary){left.heading(l.summary);left.text(c.summary)}
  for(const key of ['hardSkills','softSkills','languages'])if(c[key]){left.heading(l[key]);left.text(c[key])}
  right.entries(l.experience,c.experience);right.entries(l.projects,c.projects);right.entries(l.education,c.education)
  return Math.min(left.y,right.y)
 }
 const col=column(margin,height-margin,width-2*margin)
 col.text(name,{bold:true,size:nameSize});col.text(c.headline,{bold:true,accent:true});col.text(contact);col.text(c.links,{after:size*.4})
 if(c.summary){col.heading(l.summary);col.text(c.summary)}
 if(template==='modern') { if(c.hardSkills){col.heading(l.hardSkills);col.text(c.hardSkills)} col.entries(l.experience,c.experience);col.entries(l.projects,c.projects);col.entries(l.education,c.education) }
 else { col.entries(l.experience,c.experience);col.entries(l.education,c.education);col.entries(l.projects,c.projects);if(c.hardSkills){col.heading(l.hardSkills);col.text(c.hardSkills)} }
 for(const key of ['languages','softSkills'])if(c[key]){col.heading(l[key]);col.text(c[key])}
 return col.y
}
export async function makeResumePdf(resume) {
 const doc=await PDFDocument.create(), page=doc.addPage([612,792])
 const family=resume.template==='harvard'?[StandardFonts.TimesRoman,StandardFonts.TimesRomanBold]:[StandardFonts.Helvetica,StandardFonts.HelveticaBold]
 const fonts={regular:await doc.embedFont(family[0]),bold:await doc.embedFont(family[1])}
 let size=10
 while(size>=7 && build(doc,page,fonts,resume,size,false)<30)size-=.25
 if(size<7)throw new Error('El contenido no cabe en una página con un tamaño legible. Desmarca elementos o resume el texto.')
 build(doc,page,fonts,resume,size,true)
 doc.setTitle(resume.title); doc.setAuthor(resume.content.name || '');return doc.save()
}
