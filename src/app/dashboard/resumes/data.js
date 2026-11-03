const emptySource={profile:null,email:null,links:[],skills:[],experiences:[],learning:[],projects:[]}
export function defaultSelection(source=emptySource) {
 return {includeHeadline:true,includeSummary:true,includeEmail:true,phone:'',location:'',linkIds:source.links.map(x=>x.id),skillIds:source.skills.map(x=>x.id),learningIds:source.learning.filter(x=>x.type==='degree').map(x=>x.id),experiences:source.experiences.map(x=>({id:x.id,detail:'summary'})),projects:[],overrides:{}}
}
export function missingSelections(selection,source) {
 const missing=[]
 for(const [label,selected,items] of [['enlaces',selection.linkIds,source.links],['habilidades',selection.skillIds,source.skills],['formación',selection.learningIds,source.learning],['experiencias',selection.experiences.map(x=>x.id),source.experiences],['proyectos',selection.projects.map(x=>x.id),source.projects]]) {
  const available=new Set(items.map(item=>item.id)), absent=selected.filter(id=>!available.has(id));if(absent.length)missing.push({label,count:absent.length})
 }
 return missing
}
export function formatRange(a,b) {return [a,b].filter(Boolean).map(x=>String(x).slice(0,10)).join(' — ')}
export function skillText(skill) {return [skill.name,skill.description].filter(Boolean).join(' — ')}
export function resolveResume(resume,source) {
 const s=resume.content,locale=resume.locale,present=locale==='es-MX'?'Actualidad':'Present',overrides=s.overrides?.[locale]||{}
 const value=(key,original)=>Object.prototype.hasOwnProperty.call(overrides,key)?overrides[key]:(original||'')
 const lookup=(items,id)=>items.find(item=>item.id===id)
 const skills=s.skillIds.map(id=>lookup(source.skills,id)).filter(Boolean)
 const group=types=>skills.filter(skill=>types.includes(skill.group)).map(skill=>value(`skill:${skill.id}`,skillText(skill))).filter(Boolean).join('\n')
 const entries=(refs,items,kind)=>refs.map(ref=>{const item=lookup(items,ref.id);if(!item)return null;const prefix=`${kind}:${item.id}`;return {selected:true,title:value(`${prefix}:title`,item.title),organization:kind==='experience'?value(`${prefix}:organization`,item.company):'',dates:value(`${prefix}:dates`,kind==='experience'?formatRange(item.startMonth,item.isCurrent?present:item.endMonth):formatRange(item.startDate,item.endDate)),details:value(`${prefix}:${ref.detail}`,item[ref.detail])}}).filter(Boolean)
 const content={name:value('name',source.profile?.name),headline:s.includeHeadline?value('headline',source.profile?.headline):'',email:s.includeEmail?value('email',source.email):'',phone:s.phone,location:s.location,links:s.linkIds.map(id=>{const item=lookup(source.links,id);return item?value(`link:${id}`,item.url):''}).filter(Boolean).join('\n'),summary:s.includeSummary?value('summary',source.profile?.biography):'',hardSkills:group(['programming_language','tool']),softSkills:group(['soft_skill']),languages:group(['spoken_language']),experience:entries(s.experiences,source.experiences,'experience'),projects:entries(s.projects,source.projects,'project'),education:s.learningIds.map(id=>lookup(source.learning,id)).filter(Boolean).map(item=>{const prefix=`learning:${item.id}`;return {selected:true,title:value(`${prefix}:title`,item.title),organization:value(`${prefix}:organization`,item.provider),dates:value(`${prefix}:dates`,formatRange(item.startedOn,item.completedOn)),details:value(`${prefix}:description`,item.description)}})}
 return {...resume,content}
}
