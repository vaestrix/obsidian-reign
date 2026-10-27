// Operator recovery only: recent metadata in, aggregate counts out. No customer sends.
const WINDOW=24*60*60*1000;
export async function recoverRecentInbox({list,enqueue,storage,now=Date.now()}) {
 const result=await list();
 if(!Array.isArray(result?.data)||result.data.length>100)throw Error('Unexpected inbox listing');
 let queued=0,duplicates=0,skipped=0,remaining=0;
 for(const message of result.data) {
  const date=typeof message.date==='string'?Date.parse(message.date):NaN;
  if(message.path!=='INBOX'||!Number.isSafeInteger(message.uid)||message.uid<1||
    typeof message.messageId!=='string'||!message.messageId.trim()||message.messageId.length>998||/[\r\n]/.test(message.messageId)||
    !Number.isFinite(date)||date<now-WINDOW||date>now+300000){skipped++;continue;}
  const keys=['job:message:'+message.messageId,'job:INBOX:'+message.uid,'message:'+message.messageId];
  if((await Promise.all(keys.map(key=>storage.get(key)))).some(Boolean)){duplicates++;continue;}
  if(queued>=20){remaining++;continue;}
  const response=await enqueue({messageId:message.messageId,forceReview:true});
  if(response.duplicate)duplicates++;
  else if(response.accepted)queued++;
  else throw Error('Inbox enqueue was not confirmed');
 }
 return {queued,duplicates,skipped,remaining,checked:result.data.length,reviewOnly:true,
  since:new Date(now-WINDOW).toISOString(),historyLimited:!Number.isInteger(result.pagination?.totalPages)||result.pagination.totalPages>1||result.data.length===100};
}
