import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const kit=path.dirname(root);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
const files=['index.html','app.js','styles.css','controls.css'];
new vm.Script(js,{filename:'app.js'});
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(ids.length,new Set(ids).size,'HTML IDs must be unique');
for(const [,id] of js.matchAll(/\$\('([^']+)'\)/g)) assert(ids.includes(id),`Missing HTML element: ${id}`);
for(const [,id] of html.matchAll(/(?:aria-controls|aria-labelledby|for)="([^"]+)"/g)) assert(ids.includes(id),`Broken accessibility association: ${id}`);
assert.equal((html.match(/role="tab"/g)||[]).length,4,'All four tabs are present');
assert.equal((html.match(/role="tabpanel"/g)||[]).length,4,'All four panels are present');
assert(!/https?:\/\//.test(html),'App document must not require remote assets');
assert(!/\/assets\//.test(html.replaceAll('../assets/','')),'Asset URLs must work beneath a GitHub Pages prefix');
for(const file of files)assert(fs.statSync(path.join(root,file)).size>0,`Empty app source: ${file}`);
const species=JSON.parse(fs.readFileSync(path.join(kit,'game/species.json'),'utf8'));
assert.equal(species.name,'Vitrake');
assert.equal(Object.keys(species.typeMatchups).length,18,'All eighteen defensive matchups required');
assert(species.moves.length>0,'Move data required');
const manifest=JSON.parse(fs.readFileSync(path.join(kit,'sprites/manifest.json'),'utf8'));
for(const sheet of Object.values(manifest.sheets))assert(fs.existsSync(path.join(kit,'sprites',sheet)),`Missing sprite sheet ${sheet}`);
const report={checkedAt:new Date().toISOString(),javascript:'parse passed',uniqueIds:ids.length,tabPanels:4,moveRows:species.moves.length,typeMatchups:18,spriteSheets:Object.keys(manifest.sheets).length,portableURLs:true};
if(process.argv.includes('--build')){
  // The source is directly deployable. Produce a separate portable package with
  // its sibling asset layout retained and without recursive build output.
  const out=path.join(root,'dist');
  fs.mkdirSync(path.join(out,'web'),{recursive:true});
  for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,'web',file));
  for(const folder of ['assets','sprites','game','cards','downloads','research']){
    const source=path.join(kit,folder);
    if(fs.existsSync(source))fs.cpSync(source,path.join(out,folder),{recursive:true});
  }
  if(fs.existsSync(path.join(kit,'README.md')))fs.copyFileSync(path.join(kit,'README.md'),path.join(out,'README.md'));
  fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=web/"><title>Vitrake Pokédex</title><a href="web/">Open Vitrake’s Pokédex</a></html>\n');
  fs.writeFileSync(path.join(out,'.nojekyll'),'');
  report.build='dist/ contains a portable static site; no publish or deploy performed';
}
fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
