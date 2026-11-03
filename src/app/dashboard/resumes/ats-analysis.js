// A small, explicit bilingual vocabulary. It is a starting point, not a model of an employer's ATS.
const concepts = [
 ['DevOps','technical',['devops']], ['CI/CD','technical',['ci/cd','ci cd','continuous integration','continuous delivery','continuous deployment','integracion continua','entrega continua','despliegue continuo']],
 ['Infrastructure as Code','technical',['infrastructure as code','infraestructura como codigo','iac']], ['AWS','technical',['aws','amazon web services']], ['Azure','technical',['azure','microsoft azure']], ['Google Cloud','technical',['google cloud','gcp']],
 ['Cloud','technical',['cloud','cloud technologies','cloud services','nube','servicios en la nube']], ['Docker','technical',['docker']], ['Kubernetes','technical',['kubernetes','k8s']], ['Terraform','technical',['terraform']], ['Ansible','technical',['ansible']],
 ['Linux','technical',['linux']], ['Windows Server','technical',['windows server']], ['System administration','technical',['system administration','systems administration','administracion de sistemas','administracion de servidores']],
 ['Jenkins','technical',['jenkins']], ['GitLab','technical',['gitlab']], ['GitHub Actions','technical',['github actions']], ['Bitbucket Pipelines','technical',['bitbucket pipelines']], ['Git','technical',['git']],
 ['Python','technical',['python']], ['Java','technical',['java']], ['JavaScript','technical',['javascript','js']], ['TypeScript','technical',['typescript','ts']], ['C#','technical',['c#']], ['C++','technical',['c++']], ['Go','technical',['go','golang']], ['.NET','technical',['.net','dotnet']], ['PHP','technical',['php']], ['Shell','technical',['shell','shell script','bash','shell scripting']],
 ['Node.js','technical',['node.js','nodejs']], ['React','technical',['react','react.js']], ['Angular','technical',['angular']], ['Vue','technical',['vue','vue.js']], ['SQL','technical',['sql']], ['PostgreSQL','technical',['postgresql','postgres']], ['MongoDB','technical',['mongodb']],
 ['Excel','technical',['excel','microsoft excel']], ['Monitoring','technical',['monitoring','observability','monitoreo','observabilidad']], ['Automation','technical',['automation','automate','automated','automatizacion','automatizar']], ['Security','technical',['security','seguridad']], ['Networking','technical',['networking','network','redes']],
 ['English','language',['english','ingles']], ['Spanish','language',['spanish','espanol']],
 ['Problem solving','soft',['problem solving','problem-solving','resolucion de problemas']], ['Communication','soft',['communication','communication skills','comunicacion','habilidades de comunicacion']], ['Collaboration','soft',['collaboration','collaborate','teamwork','colaboracion','trabajo en equipo']]
].map(([label,category,aliases])=>({label,category,aliases}))
const headingPatterns = {
 summary:/^(?:professional\s+)?(?:summary|profile|about me|resumen|perfil|perfil profesional|sobre mi)\s*:?$/,
 experience:/^(?:(?:work|professional|employment|professional work|experiencia laboral|experiencia profesional)\s+)?(?:experience|history|experiencia|trayectoria)(?:\s+(?:laboral|profesional))?\s*:?$/,
 skills:/^(?:(?:hard|soft|technical|key|core|professional|habilidades|competencias)\s+)?(?:skills|habilidades|competencias|tecnologias|technologies)(?:\s+(?:tecnicas|personales|tecnologicas))?\s*:?$/,
 education:/^(?:education|academic background|education and training|educacion|formacion|formacion academica|estudios)\s*:?$/,
 projects:/^(?:projects|proyectos)\s*:?$/,
 languages:/^(?:languages|idiomas)\s*:?$/,
 contact:/^(?:contact|contact information|contacto|datos de contacto)\s*:?$/,
}
const sectionLabels={summary:'Perfil',experience:'Experiencia',skills:'Habilidades',education:'Formación',projects:'Proyectos',languages:'Idiomas',contact:'Contacto'}
export const normalize = value => String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[\u00a0\u2000-\u200b]/g,' ').replace(/[\u2010-\u2015]/g,'-')
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')
function matcher(term){const normalized=normalize(term).trim();if(!normalized)return null;const pattern=escapeRegex(normalized).replace(/\s+/g,'\\s+');return new RegExp(`(^|[^\\p{L}\\p{N}])(${pattern})(?=$|[^\\p{L}\\p{N}])`,'gu')}
function prepareEvidence(text){
 const original=String(text||''),positions=[];let normalized='',offset=0
 for(const character of original){const part=normalize(character);normalized+=part;for(let index=0;index<part.length;index++)positions.push(offset);offset+=character.length}
 return {original,normalized,positions}
}
function evidenceIn(prepared,terms){
 for(const term of terms){const regex=matcher(term);if(!regex)continue;let hit;while((hit=regex.exec(prepared.normalized))){if(['js','ts'].includes(normalize(term).trim())&&hit[1]==='.')continue;const start=hit.index+hit[1].length,end=start+hit[2].length;const originalStart=prepared.positions[start],last=prepared.positions[end-1];if(originalStart===undefined||last===undefined)continue;const originalEnd=last+(prepared.original.codePointAt(last)>0xffff?2:1),from=Math.max(0,originalStart-70),to=Math.min(prepared.original.length,originalEnd+100);return {term,excerpt:(from?'…':'')+prepared.original.slice(from,to).replace(/\s+/g,' ').trim()+(to<prepared.original.length?'…':'')}}}
 return null
}
export function findEvidence(text,terms){return evidenceIn(prepareEvidence(text),terms)}
export function suggestedTerms(jobDescription){const prepared=prepareEvidence(jobDescription);return concepts.map(concept=>({...concept,jobEvidence:evidenceIn(prepared,concept.aliases)})).filter(item=>item.jobEvidence)}
export function compareTerms(resumeText,jobDescription,terms){const resume=prepareEvidence(resumeText),job=prepareEvidence(jobDescription);return terms.map(term=>{const aliases=term.aliases?.length?term.aliases:[term.label];return {...term,jobEvidence:evidenceIn(job,aliases),resumeEvidence:evidenceIn(resume,aliases)}})}
export function analyzeText(text,{format='text',pageCount=null}={}) {
 const original=String(text||'').replace(/\r\n?/g,'\n'), lines=original.split('\n'), sections={}
 for(const line of lines){const normalized=normalize(line).trim().replace(/\s+/g,' ');if(normalized.length>65)continue;for(const [key,pattern] of Object.entries(headingPatterns))if(pattern.test(normalized)&&!sections[key])sections[key]={label:sectionLabels[key],evidence:line.trim()}}
 const bullets=lines.map(line=>line.trim()).filter(line=>/^(?:[-–—•●▪◦*]\s*|\d{1,2}[.)]\s+)(?=\S)/u.test(line)).map(line=>({text:line,hasNumber:/\d/.test(line)}))
 const email=original.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]||null
 const checks=[
  {label:'Texto extraíble',state:original.replace(/\s/g,'').length>=50?'ok':'review',detail:original.replace(/\s/g,'').length>=50?'Se extrajo texto; revisa el orden y su integridad.':'Hay poco texto extraíble. Si es una imagen, se necesita OCR o un archivo con texto seleccionable.',evidence:null},
  ...(pageCount!==null?[{label:'Una página',state:pageCount===1?'ok':'review',detail:`El PDF tiene ${pageCount} ${pageCount===1?'página':'páginas'}.`,evidence:null}]:[]),
  {label:'Correo',state:email?'ok':'review',detail:email?'Se encontró un correo en el texto.':'No se reconoció un correo; comprueba el texto extraído.',evidence:email},
  ...['summary','experience','skills','education'].map(key=>({label:`Sección: ${sectionLabels[key]}`,state:sections[key]?'ok':'review',detail:sections[key]?'Se detectó este encabezado.':'No se reconoció un encabezado conocido; puede ser un falso negativo.',evidence:sections[key]?.evidence||null})),
  {label:'Viñetas y números',state:bullets.length?'ok':'review',detail:bullets.length?`Se detectaron ${bullets.length} viñetas; ${bullets.filter(x=>x.hasNumber).length} contienen números. Comprueba que describan resultados reales.`:'No se reconocieron viñetas. La extracción puede haber cambiado los marcadores.',evidence:bullets[0]?.text||null},
  {label:'Caracteres de reemplazo',state:original.includes('\ufffd')?'review':'ok',detail:original.includes('\ufffd')?'Se encontraron caracteres no decodificados.':'No se detectó el carácter de reemplazo Unicode.',evidence:original.includes('\ufffd')?'�':null},
 ]
 return {format,pageCount,text:original,sections,bullets,checks}
}
