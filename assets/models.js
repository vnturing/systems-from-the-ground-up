/* Deterministic teaching models. No DOM or network dependencies. */
(function (root) {
  'use strict';
  const requireInt = (x, min, max, name) => {
    if (!Number.isSafeInteger(x) || x < min || x > max) throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  };
  const power = x => Number.isSafeInteger(x) && x > 0 && (x & (x - 1)) === 0;
  function word(input, width) {
    if (![8, 16, 32].includes(width)) throw new Error('Choose 8, 16, or 32 bits.');
    const raw = String(input).trim();
    if (!/^-?(?:[0-9]+|0[xX][0-9a-fA-F]+)$/.test(raw) || raw.length > 100) throw new Error('Enter a decimal integer or a hexadecimal integer such as 0xB6.');
    const value = raw.startsWith('-') ? -BigInt(raw.slice(1)) : BigInt(raw);
    const modulus = 1n << BigInt(width);
    const unsigned = ((value % modulus) + modulus) % modulus;
    const signed = unsigned >= modulus / 2n ? unsigned - modulus : unsigned;
    const little = Array.from({length: width/8}, (_, i) => Number((unsigned >> BigInt(i*8)) & 255n).toString(16).padStart(2,'0').toUpperCase());
    return {unsigned: unsigned.toString(), signed: signed.toString(), binary: unsigned.toString(2).padStart(width,'0'), hex: unsigned.toString(16).padStart(width/4,'0').toUpperCase(), little, big: [...little].reverse(), width};
  }
  function cache(addresses, {sets=4, ways=1, line=8}={}) {
    if (!power(sets) || sets > 64 || !power(line) || line > 256) throw new Error('Sets and line bytes must be powers of two: sets ≤ 64, line bytes ≤ 256.');
    requireInt(ways,1,8,'Ways');
    if (!Array.isArray(addresses) || addresses.length < 1 || addresses.length > 256) throw new Error('Supply 1–256 addresses.');
    const contents=Array.from({length:sets},()=>[]), steps=[];
    let hits=0;
    for (const address of addresses) {
      requireInt(address,0,0xffffffff,'Address');
      const block=Math.floor(address/line), set=block%sets, tag=Math.floor(block/sets), offset=address%line;
      const entries=contents[set];
      const found=entries.indexOf(tag), hit=found!==-1;
      let evicted=null;
      if (hit) { hits++; entries.splice(found,1); }
      else if (entries.length === ways) evicted=entries.pop();
      entries.unshift(tag);
      steps.push({address,block,set,tag,offset,hit,evicted,contents:entries.slice()});
    }
    return {steps,hits,misses:addresses.length-hits,capacity:sets*ways*line};
  }
  const pageTable = Object.freeze({0:{frame:9,present:true,write:true},1:{frame:4,present:true,write:true},2:{frame:12,present:true,write:false},3:{frame:0,present:false,write:false},10:{frame:7,present:true,write:true},18:{frame:42,present:true,write:true}});
  function translate(address, bits=8, access='read') {
    requireInt(address,0,65535,'Virtual address');requireInt(bits,8,12,'Page offset bits');
    if (!['read','write'].includes(access)) throw new Error('Choose read or write.');
    const size=2**bits, vpn=Math.floor(address/size), offset=address%size, entry=pageTable[vpn];
    const base={address,size,vpn,offset};
    if (!entry) return {...base,kind:'unmapped',message:'No mapping: the OS would inspect the address-space contract; this toy table cannot translate it.'};
    if (!entry.present) return {...base,kind:'not-present',message:'Not present: OS handling is needed. This does not by itself imply disk I/O or a fatal error.'};
    if (access==='write' && !entry.write) return {...base,kind:'protection',message:'Write protection fault: the numerical frame calculation cannot grant write permission.'};
    return {...base,kind:'ok',frame:entry.frame,physical:entry.frame*size+offset,message:'Translation permitted in this model. The offset is preserved.'};
  }
  function frames(chunks, {eof=true, limit=4096}={}) {
    requireInt(limit,0,4096,'Maximum payload');
    let header=[], body=[], expected=null, completed=[], history=[], total=0;
    for (let i=0;i<chunks.length;i++) {
      const chunk=chunks[i];
      for (const byte of chunk) {
        requireInt(byte,0,255,'Byte'); if (++total>65536) throw new Error('Limit this workbench to 65536 input bytes.');
        if (expected===null) {
          header.push(byte);
          if (header.length===4) {
            expected=header.reduce((n,b)=>n*256+b,0);header=[];
            if (expected>limit) return {completed,history,status:'rejected',state:`Declared length ${expected} exceeds ${limit}; no payload allocation is allowed.`};
            if (expected===0) { completed.push([]);expected=null; }
          }
        } else {
          body.push(byte);
          if (body.length===expected) { completed.push(body);body=[];expected=null; }
        }
      }
      history.push({chunk:i+1,completed:completed.length,state:expected===null?`header ${header.length}/4`:`payload ${body.length}/${expected}`});
    }
    const partial=header.length>0 || expected!==null;
    return {completed,history,status:eof?(partial?'truncated':'clean EOF'):'awaiting input',state:expected===null?`${header.length} header bytes retained`:`${body.length}/${expected} payload bytes retained`};
  }
  function parseChunks(input) {
    if (input.length>200000) throw new Error('Input is too large for this workbench.');
    return input.split('|').map(chunk=>{
      const hex=chunk.replace(/\s/g,'');
      if (hex.length%2 || !/^[0-9a-fA-F]*$/.test(hex)) throw new Error('Each chunk needs complete hexadecimal byte pairs; use | between chunks.');
      return Array.from({length:hex.length/2},(_,i)=>parseInt(hex.slice(i*2,i*2+2),16));
    });
  }
  function schedule(order, locked=false) {
    let value=0, owner=null;
    const workers={A:{stage:0,local:null},B:{stage:0,local:null}}, trace=[];
    for (const name of order) {
      if (!workers[name]) throw new Error('Only workers A and B exist.');
      const worker=workers[name]; let action;
      if (worker.stage===3) action='already finished';
      else if (locked && owner!==null && owner!==name) action='blocked by mutex';
      else {
        if (locked && owner===null) owner=name;
        if (worker.stage===0) {worker.local=value;action=`read ${value}`;}
        else if (worker.stage===1) {worker.local++;action=`add → ${worker.local}`;}
        else {value=worker.local;action=`store ${value}`;if(locked)owner=null;}
        worker.stage++;
      }
      trace.push({name,action,value,stages:{A:workers.A.stage,B:workers.B.stage},owner});
    }
    return {value,workers,trace,owner};
  }
  function amdahl(p,s) {
    if (!Number.isFinite(p)||p<0||p>1||!Number.isFinite(s)||s<1||s>1000) throw new Error('Fraction must be 0–1 and speed factor 1–1000.');
    return {time:1-p+p/s,speedup:1/(1-p+p/s),ceiling:p===1?Infinity:1/(1-p)};
  }
  const models={word,cache,translate,pageTable,frames,parseChunks,schedule,amdahl};
  if (typeof module!=='undefined' && module.exports) module.exports=models;
  root.SystemModels=models;
})(typeof globalThis!=='undefined'?globalThis:this);
