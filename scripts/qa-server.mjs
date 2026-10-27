// Synthetic QA only: memory storage, no credentials, no email, no payment provider.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import worker,{ProjectHub} from '../src/worker.js';
const root=resolve('dist'),origin='http://127.0.0.1:4173',rows=new Map();
let alarm;
const storage={get:async k=>structuredClone(rows.get(k)),put:async(k,v)=>rows.set(k,structuredClone(v)),delete:async k=>rows.delete(k),list:async({prefix='',limit=10000}={})=>new Map([...rows].filter(([k])=>k.startsWith(prefix)).slice(0,limit).map(([k,v])=>[k,structuredClone(v)])),transaction:async fn=>fn(storage),getAlarm:async()=>alarm,setAlarm:async n=>alarm=n};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.woff':'font/woff','.woff2':'font/woff2','.xml':'application/xml','.txt':'text/plain'};
const env={STAGING:'true',PUBLIC_ORIGIN:origin,ANNA_AUTO_SEND:'false',SAVANNAH_AUTO_SEND:'false',SQUARE_PAYMENTS_ENABLED:'false',ASSETS:{fetch:async request=>{
 let pathname=decodeURIComponent(new URL(request.url).pathname);
 let target=resolve(root,'.'+pathname);
 if(target!==root&&!target.startsWith(root+sep))return new Response('Forbidden',{status:403});
 if(pathname==='/')target=resolve(root,'index.html');
 else if(!extname(target))target+='.html';
 try{const bytes=await readFile(target);return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':mime[extname(target)]||'application/octet-stream'}});}
 catch{return new Response(await readFile(resolve(root,'404.html')),{status:404,headers:{'Content-Type':'text/html'}});}
}}};
// Synthetic owner access and recovery response; never used by a production build.
env.ADMIN_PASSWORD_SHA256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('launch-qa-only-password')))).map(value=>value.toString(16).padStart(2,'0')).join('');
env.HOSTINGER_MAILBOX_ID='synthetic-mailbox';
env.SAVANNAH_INBOX={idFromName:id=>id,get:()=>({fetch:async request=>{
 const data=await request.json();if(data.recoverInbox!==true)throw Error('Unexpected synthetic inbox action');
 return Response.json({queued:2,duplicates:1,remaining:0,historyLimited:false,reviewOnly:true});
}})};
const hub=new ProjectHub({storage,blockConcurrencyWhile:fn=>fn()},env);
env.PROJECT_HUB={idFromName:x=>x,get:()=>hub};
// Any accidental provider call fails before transmission.
globalThis.fetch=async()=>{throw Error('External fetch is disabled in launch QA');};
createServer(async(req,res)=>{try{const chunks=[];for await(const chunk of req)chunks.push(chunk);const init={method:req.method,headers:req.headers};if(!['GET','HEAD'].includes(req.method))init.body=Buffer.concat(chunks);const response=await worker.fetch(new Request(origin+req.url,init),env);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(error){console.error(error);res.writeHead(500);res.end('QA request failed');}}).listen(4173,'127.0.0.1',()=>console.log('Synthetic launch QA listening on '+origin));
