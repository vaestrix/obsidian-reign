import test from 'node:test';import assert from 'node:assert/strict';import {indexNowPayload,shouldNotifyIndexNow} from '../scripts/indexnow.mjs';
const config={host:'obsidianreign.gg',key:'test-ownership-key-20261026',keyLocation:'https://obsidianreign.gg/test-ownership-key-20261026.txt'};
test('IndexNow submits only bounded public canonical URLs for the owned host',()=>{const xml='<urlset><url><loc>https://obsidianreign.gg/</loc></url><url><loc>https://obsidianreign.gg/services</loc></url></urlset>';const data=indexNowPayload(xml,config);assert.equal(data.urlList.length,2);assert.equal(data.host,config.host);for(const url of ['http://obsidianreign.gg/','https://other.example/','https://obsidianreign.gg/admin/projects','https://obsidianreign.gg/api/anna/status','https://obsidianreign.gg/after-dark','https://obsidianreign.gg/?private=yes'])assert.throws(()=>indexNowPayload('<loc>'+url+'</loc>',config));assert.throws(()=>indexNowPayload(xml,{...config,key:'../escape'}));assert.throws(()=>indexNowPayload('',config));});

test('backend and private dashboard repairs do not resubmit all public URLs',()=>{
 assert.equal(shouldNotifyIndexNow(['src/square-payments.js','src/portal.js','src/savannah.js','assets/js/portal.js','project-admin.html','docs/operational-repair-2026-10-27.md']),false);
 for(const changed of ['index.html','robots.txt','sitemap.xml','assets/css/launch.css','assets/img/studio-logo-web.webp','src/learn.js','src/public-content.js','scripts/build-assets.js','config/indexnow.json'])assert.equal(shouldNotifyIndexNow([changed]),true,changed);
});
