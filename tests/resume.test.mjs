import test from 'node:test';
import assert from 'node:assert/strict';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { makeResumePdf } from '../src/app/dashboard/resumes/pdf.js';

const content = {name:'Test Name',headline:'Ingeniero DevOps',email:'test@example.com',phone:'1234567890',location:'México',links:'https://example.com',summary:'Automatización y desarrollo.',hardSkills:'Python\nDocker',softSkills:'Aprendizaje',languages:'Español',experience:[{selected:true,title:'Ingeniero',organization:'Empresa',dates:'2020 — 2024',details:'Automatización de procesos.'},{selected:false,title:'NOT SELECTED',organization:'',dates:'',details:''}],education:[{selected:true,title:'Ingeniería',organization:'Universidad',dates:'2020',details:''}],projects:[]};
for (const template of ['harvard','original','modern']) for (const locale of ['es-MX','en-US']) test(`${template} ${locale} exports one page with readable selected text`, async()=>{
  const bytes=await makeResumePdf({title:'Prueba',template,locale,content});
  const doc=await getDocument({data:bytes,isEvalSupported:false,useSystemFonts:true}).promise;
  assert.equal(doc.numPages,1);
  const text=(await (await doc.getPage(1)).getTextContent()).items.map(item=>item.str).join(' ');
  for(const expected of ['Test Name','test@example.com','Ingeniero','Docker','Español'])assert.ok(text.includes(expected),expected);
  assert.ok(!text.includes('NOT SELECTED')); await doc.destroy();
});
test('rejects overflowing content rather than clipping it',async()=>{
 const large={...content,summary:'Demasiado contenido. '.repeat(5000)};
 await assert.rejects(makeResumePdf({title:'Prueba',template:'harvard',locale:'es-MX',content:large}),/no cabe/i);
});
test('rejects unsupported characters instead of silently changing them',async()=>{
 await assert.rejects(makeResumePdf({title:'Prueba',template:'harvard',locale:'es-MX',content:{...content,name:'Test 🐦'}}),/caracteres/i);
});

test('saved selections resolve against current portfolio data, including locale and missing records', async()=>{
 const { defaultSelection, resolveResume, missingSelections } = await import('../src/app/dashboard/resumes/data.js');
 const source={profile:{name:'Ricardo',headline:'DevOps',biography:'Original'},email:'test@example.com',links:[{id:'1',url:'https://example.com'}],skills:[{id:'2',group:'tool',name:'Docker',description:'Original description'}],experiences:[{id:'3',title:'Engineer',company:'Company',summary:'Original summary'}],learning:[{id:'4',type:'degree',title:'Degree',provider:'School'}],projects:[{id:'5',title:'Project',summary:'Summary'}]};
 const selection=defaultSelection(source),resume={title:'Version',locale:'en-US',template:'harvard',content:selection};
 assert.deepEqual(selection.experiences,[{id:'3',detail:'summary'}]);
 const updated={...source,profile:{...source.profile,biography:'Updated biography'},skills:[{...source.skills[0],description:'Updated skill'}],experiences:[{...source.experiences[0],summary:'Updated experience'}]};
 const resolved=resolveResume(resume,updated);
 assert.equal(resolved.content.summary,'Updated biography');assert.match(resolved.content.hardSkills,/Updated skill/);assert.equal(resolved.content.experience[0].details,'Updated experience');
 assert.equal(missingSelections(selection,{...updated,skills:[]})[0].label,'habilidades');
});

test('version-specific edits apply only in their language and preserve live data elsewhere', async()=>{
 const {defaultSelection,resolveResume}=await import('../src/app/dashboard/resumes/data.js');
 const source={profile:{name:'Ricardo',headline:'Engineer',biography:'Updated original'},email:'test@example.com',links:[{id:'1',url:'https://example.com'}],skills:[{id:'2',group:'tool',name:'Docker',description:'Latest'}],experiences:[{id:'3',title:'Engineer',company:'Company',summary:'Latest achievement'}],learning:[{id:'4',type:'degree',title:'Degree',provider:'School'}],projects:[]};
 const selection=defaultSelection(source);selection.overrides={'en-US':{'summary':'Tailored profile','skill:2':'Custom Docker','experience:3:summary':'Tailored achievement','learning:4:title':'Custom degree'},'es-MX':{'summary':'Perfil adaptado'}};
 const en=resolveResume({locale:'en-US',content:selection},source).content;
 assert.equal(en.summary,'Tailored profile');assert.equal(en.hardSkills,'Custom Docker');assert.equal(en.experience[0].details,'Tailored achievement');assert.equal(en.education[0].title,'Custom degree');assert.equal(en.headline,'Engineer');
 const es=resolveResume({locale:'es-MX',content:selection},source).content;
 assert.equal(es.summary,'Perfil adaptado');assert.match(es.hardSkills,/Docker — Latest/);assert.equal(es.experience[0].details,'Latest achievement');
 delete selection.overrides['en-US'].summary;assert.equal(resolveResume({locale:'en-US',content:selection},source).content.summary,'Updated original');
});
