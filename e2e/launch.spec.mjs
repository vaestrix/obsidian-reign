import {test,expect} from '@playwright/test';
test.beforeEach(async({context})=>{await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:4173'?route.continue():route.abort());});
test('public pages have working local assets and fit the viewport',async({page,request},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/pricing','/services','/services/animated-alerts','/start-project','/portfolio','/services/vtuber-branding','/learn','/learn/obs-overlay-and-alert-setup']){
  const response=await page.goto(route);expect(response.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const urls=await page.locator('img[src],script[src],link[rel=stylesheet]').evaluateAll(es=>[...new Set(es.map(e=>e.src||e.href))]);
  for(const url of urls){const asset=await request.get(url);expect(asset.status(),url).toBe(200);}
  await page.screenshot({path:info.outputPath(route==='/'?'home.png':route.replaceAll('/','-')+'.png'),fullPage:false,animations:'disabled'});
 }
 expect(errors).toEqual([]);
});
test('estimate and selected-product brief handoff work without duplicates',async({page})=>{
 await page.goto('/');
 await expect(page.locator('[data-quote-total]')).toHaveText('Choose your assets');
 await page.locator('[data-quote]').nth(4).check();
 await page.locator('[data-add-quote="199"]').click();
 await expect(page.locator('[data-quote-total]')).toHaveText('$199');
 await page.locator('[data-kit-link]').click();
 await expect(page.locator('[name=configuration]')).toHaveValue(/Creator Theme Music.*\$199/s);
 await expect(page.locator('[name=want_audio]')).toBeChecked();
});
test('standard inquiry hides adult policy and saves a synthetic brief once',async({page})=>{
 await page.goto('/start-project?service=branding');
 await expect(page.locator('[data-after-dark-inquiry]')).toBeHidden();
 expect(await page.locator('[name=platform] option').allTextContents()).not.toContain('OnlyFans');
 await page.locator('[name=name]').fill('Launch QA');
 await page.locator('[name=email]').fill('launch-qa@example.test');
 await page.locator('[name=vibe]').fill('Purple and gold');
 await page.locator('[name=scope]').fill('Synthetic test only. No production or email.');
 await page.locator('[name=consent]').check();
 const keys=[];page.on('request',r=>{if(r.url().endsWith('/api/studio/inquiries'))keys.push(r.headers()['idempotency-key']);});
 await page.locator('#project-form [type=submit]').click();
 await expect(page.locator('[data-project-status]')).toContainText('Received. Your reference is');
 const first=await page.locator('[data-project-status]').textContent();
 await page.locator('#project-form [type=submit]').click();
 await expect(page.locator('[data-project-status]')).toHaveText(first);
 expect(keys.length).toBe(2);expect(keys[0]).toBe(keys[1]);
 await expect(page.locator('[data-project-status]')).toContainText('An email confirmation has not been sent.');
 await page.goto('/start-project?service=after-dark-profile');
 await expect(page.locator('[data-after-dark-inquiry]')).toBeVisible();
});
test('mobile navigation supports open, link use, and Escape',async({page})=>{
 await page.goto('/');
 const toggle=page.locator('[data-nav-toggle]');
 if(await toggle.isVisible()){
  await toggle.click();await expect(toggle).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');await expect(toggle).toHaveAttribute('aria-expanded','false');
  await toggle.click();await page.locator('[data-nav]').getByRole('link',{name:'Pricing',exact:true}).click();
  await expect(page).toHaveURL(/\/pricing$/);
 }
});
test('private endpoints and obsolete guild paths preserve protections',async({request})=>{
 for(const route of ['/api/anna/status','/api/anna/health','/api/portal/admin/inquiries'])expect((await request.get(route)).status()).toBe(401);
 const migrated=await request.get('/raids',{maxRedirects:0});expect(migrated.status()).toBe(301);expect(migrated.headers().location).toBe('/services');
 const sitemap=await request.get('/sitemap.xml');expect(sitemap.status()).toBe(200);expect(await sitemap.text()).toContain('/services/creator-websites');
});

test('owner recovery control works in the private dashboard at desktop and mobile widths',async({page},info)=>{
 await page.setExtraHTTPHeaders({Authorization:'Basic '+Buffer.from('admin:launch-qa-only-password').toString('base64')});
 const response=await page.goto('/admin/projects');expect(response.status()).toBe(200);
 const button=page.getByRole('button',{name:'Recover recent inbox for review',exact:true});await expect(button).toBeVisible();
 await button.click();await expect(page.locator('#inbox-recovery-status')).toContainText('2 queued for owner review; 1 already recorded.');
 await expect(page.locator('#inbox-recovery-status')).toContainText('No customer reply was sent by recovery.');await expect(button).toBeEnabled();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.screenshot({path:info.outputPath('admin-inbox-recovery.png'),fullPage:false,animations:'disabled'});
});
