import fs from 'node:fs';
const config=JSON.parse(fs.readFileSync('wrangler.jsonc','utf8').replace(/^\uFEFF/,''));
if(config.main!=='src/worker.js'||config.keep_vars!==true)throw Error('Agent deployment requires the integrated entry point and preserved runtime variables.');
const source=fs.readFileSync(config.main,'utf8');
for(const path of ['/webhooks/hostinger/anna','/webhooks/hostinger','/api/anna/prospects','/api/anna/status'])if(!source.includes(path))throw Error('Missing agent route: '+path);
for(const name of ['ANNA_MAILBOX_ID','ANNA_AUTO_SEND'])if(typeof config.vars?.[name]!=='string')throw Error('Missing agent configuration: '+name);
if(Object.hasOwn(config.vars??{},'SAVANNAH_AUTO_SEND'))throw Error('Preserve the owner-managed Savannah runtime switch; do not override it during deployment.');
if(!config.durable_objects?.bindings?.some(b=>b.name==='SAVANNAH_INBOX'&&b.class_name==='SavannahInbox'))throw Error('Shared inbox binding missing.');
console.log('Agent deployment entry point, routes, runtime-variable preservation and shared binding verified.');
