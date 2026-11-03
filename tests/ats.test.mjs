import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText, compareTerms, suggestedTerms } from '../src/app/dashboard/resumes/ats-analysis.js';

test('recognizes the supplied CV section labels and bullets without spaces',()=>{
 const text='CONTACT\nprofile@example.com\nPROFILE\nAn experienced engineer.\nHARD SKILLS\nPython\nEXPERIENCE\n-Migrated a pipeline, cutting build time 50%.\n-Automated tasks.\nEDUCATION\nDegree';
 const report=analyzeText(text,{format:'pdf',pageCount:1});
 for(const section of ['summary','skills','experience','education','contact'])assert.ok(report.sections[section],section);
 assert.equal(report.bullets.length,2);assert.equal(report.bullets.filter(x=>x.hasNumber).length,1);
 assert.equal(report.checks.find(x=>x.label==='Correo').evidence,'profile@example.com');
});
test('recognizes Spanish headers and reports evidence without assuming a pass',()=>{
 const report=analyzeText('PERFIL\nProfesional\nHABILIDADES TÉCNICAS\nDocker\nEXPERIENCIA LABORAL\n• Mejoré procesos en 20%.\nFORMACIÓN\nIngeniería');
 for(const section of ['summary','skills','experience','education'])assert.ok(report.sections[section],section);
 assert.equal(report.sections.skills.evidence,'HABILIDADES TÉCNICAS');assert.equal(report.bullets.length,1);assert.equal('score' in report,false);
});
test('matches whole technical terms and synonyms, not unrelated substrings',()=>{
 const job='Excellent English and Google experience with DevOps, C++, C#, CI/CD, AWS and infrastructure as code.';
 const terms=suggestedTerms(job);const labels=terms.map(x=>x.label);
 assert.ok(labels.includes('C++'));assert.ok(labels.includes('C#'));assert.ok(labels.includes('CI/CD'));assert.ok(labels.includes('Infrastructure as Code'));assert.ok(!labels.includes('Go'));assert.ok(!labels.includes('Excel'));assert.ok(suggestedTerms('Microsoft Excel is required').some(item=>item.label==='Excel'));
 const findings=compareTerms('Designed continuous integration with C# and JavaScript.',job,[...terms,{label:'Excel',category:'custom',aliases:['Excel']}]);
 assert.ok(findings.find(x=>x.label==='CI/CD').resumeEvidence);assert.equal(findings.find(x=>x.label==='C++').resumeEvidence,null);assert.equal(findings.find(x=>x.label==='Excel').jobEvidence,null);
 assert.match(findings.find(x=>x.label==='C#').resumeEvidence.excerpt,/C#/);
 const js=suggestedTerms('JavaScript developer').find(x=>x.label==='JavaScript');
 assert.equal(compareTerms('Built services using Node.js.', 'JavaScript developer', [js])[0].resumeEvidence,null);
 assert.ok(compareTerms('Node.js plus JS.', 'JavaScript developer', [js])[0].resumeEvidence);
});
test('does not mark ordinary prose as a section heading',()=>{
 const report=analyzeText('I use my skills in projects every day.\nContact me for experience with SQL.');
 assert.equal(report.sections.skills,undefined);assert.equal(report.sections.experience,undefined);
});
test('returns evidence from the original accented text',()=>{
 const job='Buscamos automatización y comunicación eficaz';
 const candidate=suggestedTerms(job).find(item=>item.label==='Automation');
 assert.ok(candidate);assert.match(candidate.jobEvidence.excerpt,/automatización/);
 const match=compareTerms('Experiencia en automatización de procesos.',job,[candidate])[0];
 assert.match(match.resumeEvidence.excerpt,/automatización/);
});
