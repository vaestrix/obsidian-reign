import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/deploy-staging-manual.yml',import.meta.url),'utf8');
test('staging deployment requires explicit manual confirmation',()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/github\.event\.inputs\.confirmation == 'DEPLOY-STAGING-ONLY'/);
 assert.doesNotMatch(workflow,/push:/);
 assert.doesNotMatch(workflow,/pull_request:/);
});
test('staging deployment is scoped to staging configuration and gated environment',()=>{
 assert.match(workflow,/environment: obsidian-reign-staging/);
 assert.match(workflow,/wrangler deploy --config wrangler\.staging\.jsonc/);
 assert.match(workflow,/SAVANNAH_AUTO_SEND/);
 assert.match(workflow,/STAGING_URL/);
});
