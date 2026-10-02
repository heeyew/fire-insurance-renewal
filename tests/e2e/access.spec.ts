import {test,expect} from '@playwright/test';
test.use({storageState:{cookies:[],origins:[]}});
test('Anonymous visitors sign in before reading private portfolios or exporting',async({page,request})=>{
  await page.goto('/');await expect(page).toHaveURL(/\/login(?:\?|$)/);
  await expect(page.getByRole('heading',{name:'Sign in to your workspace'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Email me a sign-in link'})).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  for(const path of ['/properties','/renewals','/teams']) {await page.goto(path);await expect(page).toHaveURL(/\/login(?:\?|$)/);}
  const exportResponse=await request.get('/api/export/csv');expect(exportResponse.status()).toBe(401);expect(await exportResponse.json()).toEqual({error:'Sign in to export your team portfolio.'});
});

test('Sign-in cooldown and distinct errors are clear without emailing users',async({page,context,baseURL},testInfo)=>{
  await context.addCookies([{name:'sign-in-retry-at',value:String(Date.now()+4000),url:baseURL!,httpOnly:true}]);
  await page.goto('/login?sent=1');
  await expect(page.getByRole('status')).toContainText('accepted your request');
  await expect(page.getByRole('button',{name:/Resend available in/})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Email me a sign-in link'})).toBeEnabled({timeout:10000});
  await context.clearCookies();
  for(const [error,text] of [['cooldown','requested recently'],['email-limit','sending limit'],['email-not-authorized','cannot send to this address'],['callback','different browser'],['constructor','could not send']]) {
    await page.goto(`/login?error=${error}`);
    await expect(page.locator('main').getByRole('alert')).toContainText(text);
  }
  await context.addCookies([{name:'sign-in-retry-at',value:String(Date.now()+60000),url:baseURL!,httpOnly:true}]);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/login?error=cooldown');
  await page.screenshot({path:testInfo.outputPath('sign-in-cooldown.png'),fullPage:true});
});

test('Mobile sign-in and navigation stay reachable without sending email',async({page},testInfo)=>{
  await page.goto('/login');
  for(const width of [320,390,760]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
    const input=page.getByLabel('Work email');
    expect(await input.evaluate(element=>getComputedStyle(element).fontSize)).toBe('16px');
    const button=page.getByRole('button',{name:'Email me a sign-in link'});
    const bounds=await button.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({width:390,height:844});
  const menu=page.getByRole('button',{name:'Toggle navigation'});
  await menu.click();await expect(menu).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');await expect(menu).toHaveAttribute('aria-expanded','false');
  await menu.click();await page.getByRole('button',{name:'Close navigation'}).click({position:{x:378,y:100}});
  await expect(menu).toHaveAttribute('aria-expanded','false');
  await page.screenshot({path:testInfo.outputPath('mobile-sign-in.png'),fullPage:true});
});

test('Email callback rejects missing credentials and clears the fragment',async({page,request})=>{
  await page.goto('/auth/complete#error=access_denied&error_description=expired');
  await expect(page.locator('main').getByRole('alert')).toContainText('expired');
  await expect(page).toHaveURL(/\/auth\/complete$/);
  await expect(page.getByRole('link',{name:'Return to sign-in'})).toBeVisible();
  const response=await request.get('/auth/complete');
  expect(response.headers()['referrer-policy']).toBe('no-referrer');
  expect(response.headers()['cache-control']).toContain('no-store');
  await page.goto('/auth/finish');
  await expect(page).toHaveURL(/\/login\?error=callback/);
});
