import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e', fullyParallel:false, workers:1, retries:0, timeout:45000,
 globalTimeout:360000, reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',reducedMotion:'reduce',trace:'retain-on-failure'},
 projects:[{name:'desktop',use:{viewport:{width:1440,height:1000}}},{name:'mobile',use:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}},{name:'small-mobile',use:{viewport:{width:320,height:760},isMobile:true,hasTouch:true}}],
 webServer:{command:'node scripts/qa-server.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:false,timeout:30000}
});
