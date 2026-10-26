const DATABASE='figlyph-autosave-v1',STORE='projects',MARKER='@figlyph-database';
export function createProjectStorage(key){
 let connection=null,tail=null;
 function open(){
  if(connection)return connection;
  connection=new Promise((resolve,reject)=>{
   let request,settled=false;const fail=error=>{if(settled)return;settled=true;clearTimeout(timer);reject(error);};
   const timer=setTimeout(()=>fail(Error('打开本机存储超时')),5000);
   try{request=indexedDB.open(DATABASE,1);}catch(error){fail(error);return;}
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE);};
   request.onerror=()=>fail(request.error);request.onblocked=()=>fail(Error('本机存储正被其他页面占用'));
   request.onsuccess=()=>{const db=request.result;if(settled){db.close();return;}settled=true;clearTimeout(timer);db.onversionchange=()=>{db.close();connection=null;};resolve(db);};
  }).catch(error=>{connection=null;throw error;});return connection;
 }
 async function transact(mode,raw){
  const db=await open();return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE),request=mode==='readonly'?store.get(key):store.put(raw,key);let result;
   const timer=setTimeout(()=>{try{tx.abort();}catch{}reject(Error('本机保存超时'));},10000);
   request.onsuccess=()=>{result=request.result;};tx.oncomplete=()=>{clearTimeout(timer);resolve(result);};tx.onabort=tx.onerror=()=>{clearTimeout(timer);reject(tx.error||Error('本机存储不可用'));};
  });
 }
 async function write(raw){
  try{localStorage.setItem(key,raw);return 'local';}catch{}
  await transact('readwrite',raw);
  try{localStorage.setItem(key,MARKER);}catch(error){
   // If all localStorage access is blocked, restoration reads the database.
   try{localStorage.getItem(key);}catch{return 'database';}throw error;
  }
  return 'database';
 }
 return {
  async load(){let raw;try{raw=localStorage.getItem(key);}catch{return await transact('readonly')||null;}return raw===MARKER?await transact('readonly')||Promise.reject(Error('自动保存记录不存在')):raw;},
  save(raw){const operation=tail?tail.catch(()=>{}).then(()=>write(raw)):write(raw);tail=operation;operation.finally(()=>{if(tail===operation)tail=null;}).catch(()=>{});return operation;}
 };
}
