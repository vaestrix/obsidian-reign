import test from 'node:test';import assert from 'node:assert/strict';import {crawlerAllowed} from '../scripts/robots-policy.mjs';
test('training crawler blocks do not incorrectly fail public search crawler checks',()=>{
 const robots='User-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\nDisallow: /api/\n';
 for(const agent of ['Googlebot','bingbot','OAI-SearchBot']){assert.equal(crawlerAllowed(robots,agent,'/'),true);assert.equal(crawlerAllowed(robots,agent,'/services/animated-alerts'),true);assert.equal(crawlerAllowed(robots,agent,'/api/anna/status'),false);}
 assert.equal(crawlerAllowed(robots,'GPTBot','/'),false);
});
test('explicit search blocks are detected even when the default group allows crawling',()=>{
 const robots='User-agent: *\nAllow: /\nUser-agent: Bingbot\nDisallow: /\n';assert.equal(crawlerAllowed(robots,'bingbot','/'),false);assert.equal(crawlerAllowed(robots,'Googlebot','/'),true);
});
test('equally specific groups merge and the longest rule wins with allow on ties',()=>{
 const robots='User-agent: googlebot\nDisallow: /\nUser-agent: Googlebot\nAllow: /services\nDisallow: /services/private\nAllow: /services/private$\n';
 assert.equal(crawlerAllowed(robots,'Googlebot','/services/alerts'),true);assert.equal(crawlerAllowed(robots,'Googlebot','/services/private'),true);assert.equal(crawlerAllowed(robots,'Googlebot','/services/private/file'),false);
});
