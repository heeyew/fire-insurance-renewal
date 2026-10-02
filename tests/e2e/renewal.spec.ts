import {test,expect} from '@playwright/test';
import {createClient} from '@supabase/supabase-js';
import {readFile} from 'node:fs/promises';
import {today,reminderDate,nextYear,statusFor,STATUSES} from '../../lib/domain';

test('Director creates, edits, renews, verifies history and refresh, exports and deletes',async({page})=>{
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const name=`E2E Test Tower ${Date.now()}`;
  const date=new Date(today()+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+14);const renewal=date.toISOString().slice(0,10);
  let id:string|undefined;
  const verifyDashboardCounts=async()=>{
    const result=await db.from('properties').select('renewal_date,reminder_date,status');
    expect(result.error).toBeNull();
    for(const status of STATUSES){
      const count=result.data!.filter(property=>statusFor(property)===status).length;
      await expect(page.getByRole('link',{name:`Show ${status} properties: ${count}`,exact:true})).toBeVisible();
    }
  };
  try {
    await page.goto('/');
    await expect(page.getByRole('heading',{name:'Stay ahead of every renewal.'})).toBeVisible();
    await page.getByRole('button',{name:'Add property',exact:false}).first().click();
    const modal=page.getByRole('dialog');
    await modal.getByLabel('Property name',{exact:true}).fill(name);
    await modal.getByLabel('Address',{exact:true}).fill('1 Test Street');
    await modal.getByLabel('Insurer',{exact:true}).fill('AIG');
    await modal.getByLabel('Policy number',{exact:true}).fill('POL-999');
    await modal.getByLabel('Insured value',{exact:true}).fill('8000000');
    await modal.getByLabel('Refurbishment cost',{exact:true}).fill('300000');
    await modal.getByLabel('Renewal date',{exact:true}).fill(renewal);
    await expect(modal.getByText('8,300,000.00',{exact:true})).toBeVisible();
    await modal.getByRole('button',{name:'Save property',exact:true}).click();
    await expect(modal).not.toBeVisible();
    let row=page.getByRole('row').filter({has:page.getByRole('link',{name,exact:true})});
    await expect(row).toContainText('8,300,000.00');await expect(row.locator('.status')).toHaveText('due');
    await verifyDashboardCounts();
    await page.getByRole('link',{name:/^Show due properties:/}).click();
    await expect(page).toHaveURL(/\?status=due$/);
    await expect(page.getByRole('heading',{name:/^Due properties/})).toBeVisible();
    for(const badge of await page.locator('tbody .status').all()) await expect(badge).toHaveText('due');
    await page.getByRole('link',{name:'All properties',exact:true}).click();
    const saved=await db.from('properties').select('*').eq('name',name).single();expect(saved.error).toBeNull();id=saved.data.id;
    expect(saved.data.reminder_date).toBe(reminderDate(renewal));
    await row.getByRole('button',{name:'Edit',exact:true}).click();
    await modal.getByLabel('Address',{exact:true}).fill('2 Updated Street');
    await modal.getByRole('button',{name:'Save property',exact:true}).click();
    await expect(modal).not.toBeVisible(); await expect(row).toContainText('2 Updated Street');
    await row.getByRole('button',{name:'Renew',exact:true}).click();
    await modal.getByLabel('New insured value',{exact:true}).fill('');
    await modal.getByRole('button',{name:'Confirm renewal',exact:true}).click();
    await expect(modal).toBeVisible();
    const noHistory=await db.from('renewal_records').select('id').eq('property_id',id!);expect(noHistory.data).toHaveLength(0);
    await modal.getByLabel('New insured value',{exact:true}).fill('9000000');
    await modal.getByLabel('Refurbishment cost',{exact:true}).fill('200000');
    await modal.getByLabel('Notes',{exact:false}).fill('Annual renewal with refurbishment');
    await expect(modal.getByText('9,200,000.00',{exact:true})).toBeVisible();
    await modal.getByRole('button',{name:'Confirm renewal',exact:true}).click();
    await expect(modal).not.toBeVisible();
    await expect(row.locator('.status')).toHaveText('renewed');
    await verifyDashboardCounts();
    await expect(row).toContainText('9,200,000.00');
    await page.reload();
    row=page.getByRole('row').filter({has:page.getByRole('link',{name,exact:true})});
    await expect(row.locator('.status')).toHaveText('renewed');
    const persisted=await db.from('properties').select('*').eq('id',id!).single();
    expect(persisted.data.renewal_date).toBe(nextYear(renewal));expect(Number(persisted.data.updated_value)).toBe(9200000);
    await row.getByRole('link',{name,exact:true}).click();
    await expect(page.getByRole('heading',{name:'Renewal history',exact:false})).toBeVisible();
    const history=page.getByRole('row').filter({hasText:'Annual renewal with refurbishment'});
    await expect(history).toContainText('8,000,000.00');await expect(history).toContainText('9,000,000.00');
    await page.getByRole('link',{name:'Renewal list',exact:true}).click();
    const downloadPromise=page.waitForEvent('download');
    await page.getByRole('button',{name:'Export CSV',exact:false}).click();
    const download=await downloadPromise;
    const csv=await readFile((await download.path())!,'utf8');
    expect(csv).toContain(name);expect(csv).toContain('"9200000.00"');expect(csv).toContain(nextYear(renewal));
    await page.emulateMedia({media:'print'});
    await expect(page.locator('.sidebar')).not.toBeVisible();await expect(page.getByRole('heading',{name:'Renewal list',exact:true})).toBeVisible();
    await page.emulateMedia({media:'screen'});
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Toggle navigation'}).click();
    await page.getByRole('link',{name:'Properties',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Properties',exact:true})).toBeVisible();
    row=page.getByRole('row').filter({has:page.getByRole('link',{name,exact:true})});
    await row.getByRole('button',{name:'Delete',exact:true}).click();
    await modal.getByRole('button',{name:'Delete property',exact:true}).click();
    await expect(page.getByRole('link',{name,exact:true})).toHaveCount(0);
    expect((await db.from('properties').select('id').eq('id',id!)).data).toHaveLength(0);
    expect((await db.from('renewal_records').select('id').eq('property_id',id!)).data).toHaveLength(0);
    id=undefined;
  } finally {
    if(!id){const remaining=await db.from('properties').select('id').eq('name',name).maybeSingle();id=remaining.data?.id;}
    if(id) await db.from('properties').delete().eq('id',id);
  }
});
