/* Shared browser components for deterministic models. */
(function(){
  'use strict';
  const M=window.SystemModels;
  const escape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const table=(headers,rows)=>'<div class="table-wrap"><table><thead><tr>'+headers.map(x=>`<th scope="col">${escape(x)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>`<td>${escape(x)}</td>`).join('')+'</tr>').join('')+'</tbody></table></div>';
  const fields=(controls,note)=>`<form class="sim-form"><div class="sim-controls">${controls}<button type="submit">Run prediction</button></div><p class="sim-note">${note}</p><p class="sim-error" role="alert"></p></form><div class="sim-output" aria-live="polite"></div>`;
  const field=(label,name,value,type='text',extra='')=>`<label>${label}<input name="${name}" type="${type}" value="${value}" ${extra}></label>`;
  function bind(root,render){
    const form=root.querySelector('form'),output=root.querySelector('.sim-output'),error=root.querySelector('.sim-error');
    function update(event){
      if(event)event.preventDefault();
      try{error.textContent='';render(new FormData(form),output,form);}
      catch(e){error.textContent=e.message;output.replaceChildren();}
    }
    form.addEventListener('submit',update);update();
    return update;
  }
  const views={
    bits(root){
      root.innerHTML=fields(field('Integer','value','182')+'<label>Width<select name="width"><option>8</option><option>16</option><option>32</option></select></label>','Values are reduced modulo 2^width. Click a bit to toggle it. Bytes are shown in increasing address order.');
      const update=bind(root,(data,out,form)=>{
        const result=M.word(data.get('value'),Number(data.get('width')));
        out.innerHTML='<div class="bits">'+result.binary.split('').map((b,i)=>`<button type="button" data-bit="${result.width-1-i}" class="${b==='1'?'on':''}" aria-label="Toggle bit ${result.width-1-i}, currently ${b}">${b}</button>`).join('')+'</div><dl><dt>Unsigned</dt><dd>'+result.unsigned+'</dd><dt>Two’s-complement signed</dt><dd>'+result.signed+'</dd><dt>Hex value</dt><dd>0x'+result.hex+'</dd><dt>Little-endian bytes</dt><dd>'+result.little.join(' ')+'</dd><dt>Big-endian bytes</dt><dd>'+result.big.join(' ')+'</dd></dl>';
        out.querySelectorAll('[data-bit]').forEach(button=>button.addEventListener('click',()=>{
          form.elements.value.value=(BigInt(result.unsigned)^(1n<<BigInt(button.dataset.bit))).toString();update();
          out.querySelector(`[data-bit="${button.dataset.bit}"]`).focus();
        }));
      });
    },
    cache(root){
      root.innerHTML=fields(field('Sets','sets','4','number','min="1" max="64"')+field('Ways','ways','1','number','min="1" max="8"')+field('Line bytes','line','8','number','min="1" max="256"')+'<label class="wide">Byte-address trace<input name="trace" value="0, 1, 32, 0, 8"></label>','Empty initial state; one-byte reads; LRU replacement. Powers of two for sets and line size. No writes, prefetch, timing, or other cache levels.');
      bind(root,(data,out)=>{
        const raw=data.get('trace').trim();
        if(!raw)throw new Error('Enter at least one byte address.');
        const entries=raw.split(/[\s,]+/);
        if(entries.some(x=>! /^(?:[0-9]+|0[xX][0-9a-fA-F]+)$/.test(x)))throw new Error('Use nonnegative decimal or hexadecimal addresses.');
        const result=M.cache(entries.map(Number),{sets:Number(data.get('sets')),ways:Number(data.get('ways')),line:Number(data.get('line'))});
        out.innerHTML=`<p><strong>${result.hits} hits · ${result.misses} misses</strong> · data capacity ${result.capacity} bytes · hit rate ${(100*result.hits/result.steps.length).toFixed(1)}%</p>`+table(['Address','Block','Set','Tag','Offset','Result','Evicted tag'],result.steps.map(x=>[x.address,x.block,x.set,x.tag,x.offset,x.hit?'hit':'miss',x.evicted===null?'—':x.evicted]));
      });
    },
    vm(root){
      root.innerHTML=fields(field('Virtual address','address','0x1234')+'<label>Page offset bits<select name="bits">'+[8,9,10,11,12].map(n=>`<option>${n}</option>`).join('')+'</select></label><label>Access<select name="access"><option value="read">Read</option><option value="write">Write</option></select></label>','16-bit virtual address. The toy table below is fixed; changing page size changes how an address selects its VPN. This is translation arithmetic, not a TLB or residency simulator.');
      bind(root,(data,out)=>{
        const raw=data.get('address').trim();if(!/^(?:[0-9]+|0[xX][0-9a-fA-F]+)$/.test(raw))throw new Error('Use a decimal or hexadecimal address from 0 through 65535.');
        const r=M.translate(Number(raw),Number(data.get('bits')),data.get('access'));
        out.innerHTML=`<dl><dt>Page size</dt><dd>${r.size} bytes</dd><dt>VPN</dt><dd>${r.vpn}</dd><dt>Offset</dt><dd>${r.offset}</dd><dt>Outcome</dt><dd>${escape(r.kind)}</dd>${r.kind==='ok'?`<dt>Physical address</dt><dd>0x${r.physical.toString(16).toUpperCase()} (${r.physical})</dd>`:''}</dl><p>${escape(r.message)}</p>`+table(['VPN','Frame','Present','Writable'],Object.entries(M.pageTable).map(([vpn,x])=>[vpn,x.frame,x.present?'yes':'no',x.write?'yes':'no']));
      });
    },
    framing(root){
      root.innerHTML=fields('<label class="wide">Hex byte chunks · separate arrivals with |<textarea name="chunks" rows="3">00 00 | 00 03 63 | 61 74</textarea></label><label>Maximum payload<input name="limit" type="number" value="4096" min="0" max="4096"></label><label><input name="eof" type="checkbox" checked> End of stream</label>','Four-byte unsigned big-endian length, then payload. Zero length is valid. Each chunk must contain whole byte pairs; a header can span chunks.');
      bind(root,(data,out)=>{
        const r=M.frames(M.parseChunks(data.get('chunks')),{eof:data.has('eof'),limit:Number(data.get('limit'))});
        out.innerHTML=`<p><strong>${escape(r.status)}</strong> · ${escape(r.state)}</p>`+table(['After chunk','Complete frames','Pending state'],r.history.map(x=>[x.chunk,x.completed,x.state]))+'<p>Completed payloads (hex):</p><ol>'+r.completed.map(x=>'<li><code>'+ (x.length?x.map(b=>b.toString(16).padStart(2,'0')).join(' '):'(empty)')+'</code></li>').join('')+'</ol>';
      });
    },
    race(root){
      let order=[];
      root.innerHTML='<p class="sim-note">Two increments in a finite read/add/store model. Real unsynchronized C races are undefined behavior, not limited to these outcomes.</p><label><input type="checkbox" data-locked> Mutex protects the entire increment</label><div class="button-row"><button type="button" data-worker="A">Advance A</button><button type="button" data-worker="B">Advance B</button><button type="button" class="secondary" data-race-reset>Reset</button></div><div class="button-row"><button class="secondary" type="button" data-preset="AABBAB">Lost-update schedule</button><button class="secondary" type="button" data-preset="AAABBB">Serial schedule</button></div><div class="sim-output" aria-live="polite"></div>';
      const draw=()=>{
        const locked=root.querySelector('[data-locked]').checked,r=M.schedule(order,locked);
        root.querySelector('.sim-output').innerHTML=`<p>Counter: <strong>${r.value}</strong> · A: ${['ready to read','ready to add','ready to store','finished'][r.workers.A.stage]} · B: ${['ready to read','ready to add','ready to store','finished'][r.workers.B.stage]}</p>`+table(['Step','Worker','Action','Shared counter'],r.trace.map((x,i)=>[i+1,x.name,x.action,x.value]));
        root.querySelectorAll('[data-worker]').forEach(button=>{const name=button.dataset.worker;button.disabled=r.workers[name].stage===3 || (locked && r.owner!==null && r.owner!==name);});
      };
      root.querySelectorAll('[data-worker]').forEach(button=>button.addEventListener('click',()=>{order.push(button.dataset.worker);draw();}));
      root.querySelector('[data-race-reset]').addEventListener('click',()=>{order=[];draw();});
      root.querySelector('[data-locked]').addEventListener('change',()=>{order=[];draw();});
      root.querySelectorAll('[data-preset]').forEach(button=>button.addEventListener('click',()=>{order=button.dataset.preset.split('');draw();}));draw();
    },
    amdahl(root){
      root.innerHTML=fields(field('Accelerated fraction (%)','fraction','60','range','min="0" max="100" step="1"')+field('Component speed factor','speed','2','number','min="1" max="1000" step="0.1"'),'Fixed workload; unchanged remaining costs; no new overhead. The ceiling assumes infinite acceleration of the selected fraction.');
      const update=bind(root,(data,out)=>{
        const p=Number(data.get('fraction'))/100,s=Number(data.get('speed')),r=M.amdahl(p,s);
        out.innerHTML=`<dl><dt>Fraction / component factor</dt><dd>${(p*100).toFixed(0)}% / ${s}×</dd><dt>Normalized runtime</dt><dd>${r.time.toFixed(4)}</dd><dt>Total speedup</dt><dd>${r.speedup.toFixed(3)}×</dd><dt>Infinite-component ceiling</dt><dd>${Number.isFinite(r.ceiling)?r.ceiling.toFixed(3)+'×':'Unbounded in this model'}</dd></dl>`;
      });root.querySelector('[name=fraction]').addEventListener('input',update);
    }
  };
  document.querySelectorAll('[data-sim]').forEach(section=>{
    try{views[section.dataset.sim](section.querySelector('.sim-root'));}
    catch(error){section.querySelector('.sim-root').textContent='Workbench unavailable: '+error.message;}
  });
})();
