(function(){
  'use strict';
  const catalog=window.COURSE, model=window.StudyModel, prefix=document.body.dataset.prefix||'';
  const $=selector=>document.querySelector(selector), $$=selector=>document.querySelectorAll(selector);
  const announce=text=>{const node=$('#announcement');if(node)node.textContent=text;};
  let state=model.empty(),persistent=true;
  function storageWarning(message){
    persistent=false;
    let notice=$('#storage-warning');
    if(!notice){notice=document.createElement('p');notice.id='storage-warning';notice.className='notice';notice.setAttribute('role','status');$('.topbar').after(notice);}
    notice.textContent=message+' Study changes are kept only for this page session. Export from My study before leaving.';
  }
  try{const raw=localStorage.getItem(model.key);if(raw)state=model.validate(JSON.parse(raw));}
  catch(error){storageWarning('Browser storage is blocked or the existing record could not be read.');}
  function save(){
    if(!persistent)return;
    try{localStorage.setItem(model.key,JSON.stringify(state));}
    catch(error){storageWarning('The browser could not save this study record.');}
  }
  const row=id=>(state.lessons[id]||(state.lessons[id]={}));
  const date=value=>new Date(value).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
  function studyList(container,items,empty){
    if(!container)return;
    container.replaceChildren();
    if(!items.length){const p=document.createElement('p');p.className='muted';p.textContent=empty;container.append(p);return;}
    const list=document.createElement('ul');list.className='study-list';
    for(const item of items){
      const li=document.createElement('li'),a=document.createElement('a'),small=document.createElement('small');
      a.href=prefix+item.path;a.textContent=String(item.id).padStart(2,'0')+' · '+item.title;
      const record=state.lessons[item.id];small.textContent=record&&record.due?'Review '+date(record.due):item.minutes+' min core';
      li.append(a,small);list.append(li);
    }container.append(list);
  }
  function refresh(){
    const completed=catalog.filter(x=>state.lessons[x.id]?.complete).length;
    $$('[data-progress-count]').forEach(node=>node.textContent=completed+' / '+catalog.length);
    $$('[data-progress]').forEach(node=>node.value=completed);
    $$('[data-done]').forEach(node=>{const done=state.lessons[node.dataset.done]?.complete;node.textContent=done?'✓':'';node.setAttribute('aria-label',done?'Self-reported complete':'Not marked complete');});
    const next=catalog.find(x=>!state.lessons[x.id]?.complete);
    const resume=$('[data-continue]');if(resume){resume.href=prefix+(next?next.path:'labs/09-capstone.html');resume.textContent=completed===0?'Begin the course ↗':next?'Continue · Lesson '+String(next.id).padStart(2,'0')+' ↗':'Return to the capstone ↗';}
    const id=document.body.dataset.lesson;
    if(id){
      const record=state.lessons[id]||{},button=$('[data-complete]');
      if(button){button.textContent=record.complete?'Mark incomplete':'Mark complete';button.setAttribute('aria-pressed',record.complete?'true':'false');}
      const status=$('[data-completion-status]');if(status)status.textContent=(record.complete?'Marked complete. ':'Not marked complete. ')+(record.due?'Next retrieval: '+date(record.due)+'.':'Schedule a retrieval check with a review button.');
    }
    const due=catalog.filter(x=>state.lessons[x.id]?.due<=Date.now()).sort((a,b)=>state.lessons[a.id].due-state.lessons[b.id].due);
    studyList($('[data-due-list]'),due,'No retrieval checks are due. Use a review button on a lesson to schedule one.');
    studyList($('[data-next-list]'),next?[next]:[],'All lessons are marked complete. Return to the capstone or retrieve a new transfer case.');
    const summary=$('[data-study-summary]');if(summary)summary.textContent=`${completed} of ${catalog.length} lessons marked complete; ${due.length} due for retrieval. These are your self-reports.`;
  }
  const theme=$('#theme-toggle');
  try{const saved=localStorage.getItem('below-surface-theme');if(saved==='dark'||saved==='light')document.documentElement.dataset.theme=saved;}
  catch(error){/* Theme is optional. */}
  theme?.addEventListener('click',()=>{
    const value=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=value;
    theme.setAttribute('aria-label','Switch to '+(value==='dark'?'light':'dark')+' theme');
    try{localStorage.setItem('below-surface-theme',value);}catch(error){/* Keep session theme. */}
  });
  const search=$('#course-search');
  search?.addEventListener('input',()=>{
    const terms=search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean),matches=new Set(catalog.filter(x=>terms.every(term=>x.search.toLocaleLowerCase().includes(term))).map(x=>String(x.id)));
    $$('[data-catalog-item]').forEach(node=>node.hidden=!matches.has(node.dataset.catalogItem));
    $$('[data-unit]').forEach(node=>node.hidden=![...node.querySelectorAll('[data-catalog-item]')].some(x=>!x.hidden));
    $('#search-status').textContent=terms.length?`${matches.size} lesson${matches.size===1?'':'s'} match. Search includes the full lesson text.`:'';
  });
  $$('[data-quiz]').forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault();const choice=new FormData(form).get('answer');if(choice===null)return;
    const correct=Number(choice)===Number(form.dataset.correct),feedback=form.querySelector('.quiz-feedback');
    feedback.textContent=(correct?'Correct. ':'Revisit the model. ')+feedback.dataset.explanation;
    feedback.classList.toggle('correct',correct);feedback.classList.toggle('incorrect',!correct);
    const id=document.body.dataset.lesson;if(id){const record=row(id);record.attempts=(record.attempts||0)+1;record.correct=(record.correct||0)+(correct?1:0);record.lastCorrect=correct;save();}
  }));
  const current=document.body.dataset.lesson;
  if(current){
    const reflection=$('[data-reflection]');
    if(reflection){reflection.maxLength=20000;reflection.value=state.lessons[current]?.reflection||'';reflection.addEventListener('input',()=>{row(current).reflection=reflection.value;save();});}
    $('[data-complete]')?.addEventListener('click',()=>{const record=row(current);record.complete=!record.complete;save();refresh();announce(record.complete?'Lesson marked complete.':'Lesson marked incomplete.');});
    $$('[data-review]').forEach(button=>button.addEventListener('click',()=>{state.lessons[current]=model.review(row(current),button.dataset.review);save();refresh();announce('Next review scheduled for '+date(state.lessons[current].due));}));
  }
  $$('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
  // Clipboard fallback keeps file:// reading useful without assuming a secure clipboard API.
  $$('.copy-code').forEach(button=>button.addEventListener('click',async()=>{
    const text=button.parentElement.querySelector('pre code').textContent;
    try{
      if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(text);
      else{const area=document.createElement('textarea');area.value=text;document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('Copy unavailable');}
      button.textContent='Copied';announce('Code copied.');setTimeout(()=>button.textContent='Copy',1800);
    }catch(error){button.textContent='Select code to copy';announce('Automatic copy is unavailable. Select the code and copy manually.');}
  }));
  $('[data-export]')?.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify(state,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='below-the-surface-progress.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('Study record exported.');
  });
  $('[data-import]')?.addEventListener('change',async event=>{
    const input=event.target,file=input.files[0],status=$('[data-import-status]');if(!file)return;
    try{if(file.size>2*1024*1024)throw new Error('File exceeds the 2 MiB study-record limit.');const candidate=model.validate(JSON.parse(await file.text()));state=candidate;save();refresh();status.textContent='Imported study record; it replaced the previous course record.';}
    catch(error){status.textContent='Import failed; the current record was kept. '+error.message;}
    input.value='';
  });
  $('[data-reset]')?.addEventListener('click',()=>{state=model.empty();save();refresh();$('[data-import-status]').textContent='Local course study record cleared. Theme preference was kept.';});
  window.addEventListener('storage',event=>{
    if(event.key!==model.key)return;
    try{state=event.newValue?model.validate(JSON.parse(event.newValue)):model.empty();refresh();const reflection=$('[data-reflection]');if(reflection&&current)reflection.value=state.lessons[current]?.reflection||'';}
    catch(error){announce('Another tab supplied an invalid record; this tab kept its current state.');}
  });
  let printDetails=[];
  window.addEventListener('beforeprint',()=>{printDetails=[...document.querySelectorAll('details:not([open])')];printDetails.forEach(node=>node.open=true);});
  window.addEventListener('afterprint',()=>{printDetails.forEach(node=>node.open=false);printDetails=[];});
  refresh();
})();
