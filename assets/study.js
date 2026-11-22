(function(root){
  'use strict';
  const COURSE='below-the-surface';
  const empty=()=>({version:1,course:COURSE,lessons:{}});
  function validate(value){
    if (!value || value.version!==1 || value.course!==COURSE || !value.lessons || Array.isArray(value.lessons) || typeof value.lessons!=='object') throw new Error('This file is not a supported Below the Surface study record.');
    const result=empty();
    for(const [id,row] of Object.entries(value.lessons)){
      if(!/^(?:[1-9]|[1-3][0-9]|40)$/.test(id) || !row || typeof row!=='object' || Array.isArray(row)) throw new Error('Invalid lesson entry in study record.');
      const clean={};
      for(const [key,v] of Object.entries(row)){
        if(key==='complete' || key==='lastCorrect'){if(typeof v!=='boolean')throw new Error('Invalid completion/answer value.');}
        else if(key==='reflection'){if(typeof v!=='string'||v.length>20000)throw new Error('A reflection is invalid or exceeds 20000 characters.');}
        else if(['attempts','correct','interval'].includes(key)){if(!Number.isSafeInteger(v)||v<0||v>(key==='interval'?4:1000000))throw new Error('Invalid study count.');}
        else if(['due','reviewed'].includes(key)){if(!Number.isSafeInteger(v)||v<0||v>8640000000000000)throw new Error('Invalid review date.');}
        else throw new Error('Unknown study field: '+key);
        clean[key]=v;
      }
      if((clean.correct||0)>(clean.attempts||0))throw new Error('Correct attempts exceed total attempts.');
      result.lessons[id]=clean;
    }
    return result;
  }
  function review(row,kind,now=Date.now()){
    if(!['again','good'].includes(kind))throw new Error('Unknown review rating.');
    const interval=kind==='again'?0:Math.min((row.reviewed===undefined?-1:(row.interval||0))+1,4);
    const days=kind==='again'?1:[1,3,7,14,30][interval];
    return {...row,interval,reviewed:now,due:now+days*86400000};
  }
  const api={empty,validate,review,key:'below-surface-study-v1'};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.StudyModel=api;
})(globalThis);
