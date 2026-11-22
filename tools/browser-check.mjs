// Dependency-free local Chrome QA through DevTools pipes. No listening port needed.
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, rm, writeFile, readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const profile=await mkdtemp(join(tmpdir(),'below-surface-chrome-'));
const chrome=process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const child=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--no-default-browser-check','--disable-breakpad','--disable-crash-reporter','--remote-debugging-pipe','--user-data-dir='+profile],{stdio:['ignore','ignore','pipe','pipe','pipe']});
let serial=0,buffer='',stderr='',failed=[];
const origin='https://below-surface.test/course/';
async function fulfill(event){
  const url=new URL(event.params.request.url);
  try{
    if(!url.pathname.startsWith('/course/'))throw new Error('Outside virtual site');
    const path=resolve(root,'dist',decodeURIComponent(url.pathname.slice('/course/'.length)));
    if(!path.startsWith(join(root,'dist')+'/'))throw new Error('Invalid virtual path');
    const data=await readFile(path);
    const extension=path.split('.').pop(), mime={html:'text/html; charset=utf-8',js:'application/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',zip:'application/zip'}[extension]||'application/octet-stream';
    await send('Fetch.fulfillRequest',{requestId:event.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:mime}],body:data.toString('base64')},event.sessionId);
  }catch(error){
    if(!url.pathname.endsWith('favicon.ico'))failed.push('Virtual-site resource failed: '+url.pathname+' '+error.message);
    await send('Fetch.fulfillRequest',{requestId:event.params.requestId,responseCode:404,body:''},event.sessionId);
  }
}const pending=new Map();
child.stderr.on('data',data=>stderr+=data.toString());
child.stdio[3].on('error',()=>{});
child.on('error',error=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(error);}pending.clear();});
child.stdio[4].on('data',data=>{
  buffer+=data.toString();let end;
  while((end=buffer.indexOf('\0'))!==-1){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(!line)continue;const event=JSON.parse(line);
    if(event.id){const item=pending.get(event.id);if(item){clearTimeout(item.timer);pending.delete(event.id);event.error?item.reject(new Error(JSON.stringify(event.error))):item.resolve(event.result);}}
    if(event.method==='Fetch.requestPaused')fulfill(event).catch(error=>failed.push(error.message));
    if(event.method==='Runtime.exceptionThrown')failed.push(event.params.exceptionDetails.text+' '+(event.params.exceptionDetails.exception?.description||''));
  }
});
child.on('exit',(code,signal)=>{for(const item of pending.values()){clearTimeout(item.timer);item.reject(new Error('Chrome exited '+(signal||code)+': '+stderr.slice(-3000)));}pending.clear();});
function send(method,params={},sessionId){return new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method+'\n'+stderr.slice(-1500)));},15000);pending.set(id,{resolve,reject,timer});child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');});}
let session;
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},session);if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function navigate(path){await send('Page.navigate',{url:origin+path},session);for(let i=0;i<50;i++){await pause(50);if(await evaluate("document.readyState==='complete' && !!window.StudyModel && !!document.querySelector('main') && location.href==="+JSON.stringify(origin+path)))return;}throw new Error('Page did not load: '+path);}
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function input(selector,value){return evaluate(`(()=>{const element=document.querySelector(${JSON.stringify(selector)});element.value=${JSON.stringify(value)};element.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
async function screenshot(name){const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},session);await writeFile(join(root,'.build',name),Buffer.from(data,'base64'));}
try{
  const {targetId}=await send('Target.createTarget',{url:'about:blank'});
  ({sessionId:session}=await send('Target.attachToTarget',{targetId,flatten:true}));
  await send('Page.enable',{},session);await send('Runtime.enable',{},session);
  // Serve local artifacts through request interception at a stable virtual HTTPS origin.
  // This exercises repository-subpath URLs and cross-page storage without opening a port.
  await send('Fetch.enable',{patterns:[{urlPattern:'https://below-surface.test/*'}]},session);
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false},session);
  await mkdir(join(root,'.build'),{recursive:true});
  await navigate('index.html');
  assert.equal(await evaluate("document.querySelectorAll('[data-catalog-item]').length"),40);
  await screenshot('home-desktop.png');
  await input('#course-search','realloc');
  assert.ok(await evaluate("[...document.querySelectorAll('[data-catalog-item]')].filter(x=>!x.hidden).length>0 && [...document.querySelectorAll('[data-catalog-item]')].filter(x=>!x.hidden).length<40"));
  await input('#course-search','zzzxnonexistent');assert.equal(await evaluate("[...document.querySelectorAll('[data-catalog-item]')].filter(x=>!x.hidden).length"),0);
  await input('#course-search','');
  await navigate('lessons/0001-follow-the-artifacts.html');
  await click('input[value="2"]');
  await evaluate("document.querySelector('[data-quiz]').requestSubmit()");
  assert.ok(await evaluate("document.querySelector('.quiz-feedback').textContent.startsWith('Correct.')"));
  await input('[data-reflection]','A source file and an executable are different artifacts.');
  await click('[data-complete]');await click('[data-review="good"]');
  assert.ok(await evaluate("JSON.parse(localStorage.getItem(StudyModel.key)).lessons['1'].complete"));
  await navigate('study.html');
  assert.ok((await evaluate("document.querySelector('[data-study-summary]').textContent")).startsWith('1 of 40'));
  await evaluate(`(async()=>{const input=document.querySelector('[data-import]'),dt=new DataTransfer();dt.items.add(new File([JSON.stringify({version:2})],'invalid.json',{type:'application/json'}));input.files=dt.files;input.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r,100));})()`);
  assert.ok((await evaluate("document.querySelector('[data-import-status]').textContent")).startsWith('Import failed'));
  assert.ok((await evaluate("document.querySelector('[data-study-summary]').textContent")).startsWith('1 of 40'));
  await navigate('lessons/0005-bytes-bits-and-endianness.html');
  await input('[name=value]','242');await evaluate("document.querySelector('.sim-form').requestSubmit()");
  assert.ok((await evaluate("document.querySelector('.sim-output').textContent")).includes('-14'));
  await navigate('lessons/0018-map-addresses-to-cache-sets.html');
  assert.ok((await evaluate("document.querySelector('.sim-output').textContent")).includes('1 hits · 4 misses'));
  await screenshot('cache-desktop.png');
  await navigate('lessons/0021-translate-a-virtual-address.html');
  assert.ok((await evaluate("document.querySelector('.sim-output').textContent")).includes('0x2A34'));
  await navigate('lessons/0034-parse-streams-not-writes.html');
  assert.ok((await evaluate("document.querySelector('.sim-output').textContent")).includes('clean EOF'));
  await input('[name=chunks]','00 00');await evaluate("document.querySelector('.sim-form').requestSubmit()");
  assert.ok((await evaluate("document.querySelector('.sim-output').textContent")).includes('truncated'));
  await navigate('lessons/0036-races-and-lock-invariants.html');await click('[data-preset="AABBAB"]');
  assert.ok((await evaluate("document.querySelector('.sim-output').textContent")).includes('Counter: 1'));
  await navigate('lessons/0017-measure-a-falsifiable-claim.html');
  assert.ok((await evaluate("document.querySelector('.sim-output').textContent")).includes('1.429'));
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},session);
  for(const path of ['index.html','lessons/0001-follow-the-artifacts.html','lessons/0018-map-addresses-to-cache-sets.html','reference/glossary.html','labs.html','study.html']){
    await navigate(path);
    assert.ok(await evaluate('document.documentElement.scrollWidth <= innerWidth+1'),path+' has horizontal overflow');
  }
  await navigate('index.html');await screenshot('home-mobile.png');
  await navigate('lessons/0001-follow-the-artifacts.html');await screenshot('lesson-mobile.png');
  assert.deepEqual(failed,[],'uncaught browser exceptions');
  console.log('PASS browser QA: desktop/mobile layout, search/no-results, quiz feedback, persistence, review, and all six workbenches. Screenshots in .build/.');
}finally{
  if(child.exitCode===null && child.signalCode===null){try{await send('Browser.close');}catch(error){child.kill();}}
  await rm(profile,{recursive:true,force:true}).catch(()=>{});
}
