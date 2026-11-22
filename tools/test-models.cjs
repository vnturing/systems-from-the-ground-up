const assert=require('node:assert/strict');
const M=require('../assets/models.js');
const S=require('../assets/study.js');
for(let n=0;n<256;n++){
  const word=M.word(String(n),8);
  assert.equal(word.unsigned,String(n));
  assert.equal(word.signed,String(n>=128?n-256:n));
  assert.equal(parseInt(word.binary,2),n);
}
assert.equal(M.word('-14',8).hex,'F2');
assert.equal(M.word('263',8).unsigned,'7');
assert.deepEqual(M.word('0x0A1B2C3D',32).little,['3D','2C','1B','0A']);
assert.deepEqual(M.word('0x0A1B2C3D',32).big,['0A','1B','2C','3D']);
assert.throws(()=>M.word('1e3',8));assert.throws(()=>M.word('1',64));
assert.equal(M.cache([0,1,32,0,8]).hits,1);
assert.deepEqual(M.cache([0,8,0,32,0]).steps.map(x=>x.hit),[false,false,true,false,false]);
assert.equal(M.cache([0,8,0,32,0],{sets:4,ways:2,line:8}).hits,2);
assert.throws(()=>M.cache([0],{sets:3,ways:1,line:8}));
assert.equal(M.translate(0x1234).physical,0x2A34);
assert.equal(M.translate(0x2abc,10).physical,0x1ebc);
assert.equal(M.translate(0x200,8,'write').kind,'protection');
assert.equal(M.translate(0x300).kind,'not-present');
assert.equal(M.translate(0x400).kind,'unmapped');
assert.throws(()=>M.translate(65536));
function encode(bytes){const n=bytes.length;return [Math.floor(n/16777216)&255,(n>>>16)&255,(n>>>8)&255,n&255,...bytes];}
const payloads=[[],[99,97,116],Array.from({length:256},(_,i)=>i)];
const stream=payloads.flatMap(encode);
for(let i=0;i<=stream.length;i++){
  const result=M.frames([stream.slice(0,i),stream.slice(i)]);
  assert.deepEqual(result.completed,payloads);assert.equal(result.status,'clean EOF');
}
let seed=12345;
for(let trial=0;trial<100;trial++){
  const chunks=[];let at=0;
  while(at<stream.length){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const size=1+seed%17;chunks.push(stream.slice(at,at+size));at+=size;}
  assert.deepEqual(M.frames(chunks).completed,payloads);
}
assert.equal(M.frames([[0,0]]).status,'truncated');
assert.equal(M.frames([[0,0]],{eof:false}).status,'awaiting input');
assert.equal(M.frames([[0,0,16,1]]).status,'rejected');
assert.equal(M.frames([[255,255,255,255]]).status,'rejected');
assert.equal(M.frames([encode(Array(4096).fill(1))]).completed[0].length,4096);
assert.deepEqual(M.parseChunks('00 00 | 00 03 63 | 61 74'),[[0,0],[0,3,99],[97,116]]);
assert.throws(()=>M.parseChunks('0 | 000'));
assert.equal(M.schedule('AABBAB').value,1);
assert.equal(M.schedule('AAABBB').value,2);
assert.equal(M.schedule('ABABABBB',true).value,2);
assert.ok(Math.abs(M.amdahl(.6,2).speedup-1/.7)<1e-12);
assert.equal(M.amdahl(0,100).speedup,1);
assert.equal(M.amdahl(1,2).speedup,2);
assert.deepEqual(S.validate(S.empty()),S.empty());
assert.throws(()=>S.validate({version:2,course:'below-the-surface',lessons:{}}));
assert.throws(()=>S.validate({version:1,course:'below-the-surface',lessons:{41:{complete:true}}}));
assert.throws(()=>S.validate({version:1,course:'below-the-surface',lessons:{1:{correct:3,attempts:2}}}));
assert.throws(()=>S.validate(JSON.parse('{"version":1,"course":"below-the-surface","lessons":{"__proto__":{}}}')));
const now=1795305600000;
let review=S.review({},'good',now);assert.equal(review.due,now+86400000);
review=S.review(review,'good',now);assert.equal(review.due,now+3*86400000);
review=S.review(review,'again',now);assert.equal(review.due,now+86400000);
console.log('PASS: representation, cache, translation, framing (all splits + seeded partitions), schedules, Amdahl, study import validation, and review intervals.');
