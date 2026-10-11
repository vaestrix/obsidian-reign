// Alias envelope probe only: never sends DATA or an email.
import tls from 'node:tls';
const password=process.env.HOSTINGER_SMTP_PASSWORD;
if(!password)throw Error('HOSTINGER_SMTP_PASSWORD is required through a secure environment; do not put it in source or command arguments.');
const socket=tls.connect({host:'smtp.hostinger.com',port:465,servername:'smtp.hostinger.com',rejectUnauthorized:true});
const replies=[],waiters=[];let buffer='',parts=[];
function fail(error){while(waiters.length)waiters.shift().reject(error);}
socket.setTimeout(15000,()=>socket.destroy(Error('SMTP timeout')));
socket.on('error',()=>fail(Error('SMTP connection failed; no email sent.')));
socket.on('close',()=>fail(Error('SMTP closed; no email sent.')));
socket.on('data',chunk=>{buffer+=chunk;let i;while((i=buffer.indexOf('\r\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+2);parts.push(line);if(/^\d{3} /.test(line)){const response={code:Number(line.slice(0,3)),lines:parts};parts=[];const waiter=waiters.shift();if(waiter)waiter.resolve(response);else replies.push(response);}}});
const read=()=>replies.length?Promise.resolve(replies.shift()):new Promise((resolve,reject)=>waiters.push({resolve,reject}));
async function command(value,expected){socket.write(value+'\r\n');const response=await read();if(response.code!==expected)throw Error('SMTP rejected a probe step with status '+response.code+'; no email sent.');return response;}
try{
 if((await read()).code!==220)throw Error('SMTP greeting unavailable');
 await command('EHLO obsidianreign.gg',250);
 await command('AUTH LOGIN',334);
 await command(Buffer.from('savannah@obsidianreign.gg').toString('base64'),334);
 await command(Buffer.from(password).toString('base64'),235);
 await command('MAIL FROM:<anna@obsidianreign.gg>',250);
 await command('RSET',250);
 await command('QUIT',221);
 console.log('SMTP authenticated and accepted Anna alias envelope. No email sent. A controlled message test is still needed to verify the visible From address and delivery.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{socket.destroy();}

