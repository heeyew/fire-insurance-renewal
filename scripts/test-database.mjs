import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert.ok(url && key,'Pull the connected Vercel environment before running database tests.');
const db=createClient(url,key,{auth:{persistSession:false}});
function checked(result){if(result.error) throw result.error; return result.data;}
let id;
try{
  const row=checked(await db.from('properties').insert({name:`Integration Test ${Date.now()}`,insured_value:8000000,refurbishment_cost:300000,renewal_date:'2028-02-29',status:'upcoming'}).select('*').single());
  id=row.id;
  assert.equal(Number(row.updated_value),8300000); assert.equal(row.reminder_date,'2028-01-30');
  const edited=checked(await db.from('properties').update({address:'Test address',refurbishment_cost:500000}).eq('id',id).select('*').single());
  assert.equal(Number(edited.updated_value),8500000); assert.equal(edited.revision,row.revision+1);
  const args={p_property_id:id,p_new_insured_value:9000000,p_refurbishment_cost:200000,p_expected_revision:edited.revision,p_notes:'Integration test'};
  checked(await db.rpc('process_property_renewal',args));
  const first=checked(await db.from('properties').select('*').eq('id',id).single());
  assert.equal(first.renewal_date,'2029-02-28'); assert.equal(first.reminder_date,'2029-01-29'); assert.equal(first.status,'renewed'); assert.equal(Number(first.updated_value),9200000);
  const stale=await db.rpc('process_property_renewal',args); assert.ok(stale.error,'A stale/double submission must be rejected.');
  const records=checked(await db.from('renewal_records').select('*').eq('property_id',id));
  assert.equal(records.length,1); assert.equal(Number(records[0].previous_insured_value),8000000); assert.equal(Number(records[0].new_insured_value),9000000);
  const invalid=await db.rpc('process_property_renewal',{...args,p_expected_revision:first.revision,p_new_insured_value:-1}); assert.ok(invalid.error);
  const attempts=await Promise.all([db.rpc('process_property_renewal',{...args,p_expected_revision:first.revision}),db.rpc('process_property_renewal',{...args,p_expected_revision:first.revision})]);
  assert.equal(attempts.filter(x=>!x.error).length,1,'Only one concurrent renewal may commit.');
  const after=checked(await db.from('properties').select('*').eq('id',id).single());
  assert.equal(after.renewal_date,'2030-02-28');
  assert.equal(checked(await db.from('renewal_records').select('id').eq('property_id',id)).length,2);
  console.log('PASS: persistent CRUD, calculated fields, renewal history, leap-year dates, invalid inputs and concurrent/double submission.');
}finally{
  if(id){checked(await db.from('properties').delete().eq('id',id)); assert.equal(checked(await db.from('renewal_records').select('id').eq('property_id',id)).length,0); console.log('PASS: delete and history cascade; disposable test data removed.');}
}
