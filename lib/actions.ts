'use server';
import { revalidatePath } from 'next/cache';
import { PropertyInput, ActionResult, amount, isDate } from './domain';
import { saveProperty,removeProperty } from './data/properties';
import { processRenewal } from './data/renewals';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function identity(id:string,revision:number) {
  if(!uuid.test(id) || !Number.isInteger(revision) || revision<0) throw new Error('Invalid property. Refresh and try again.');
}
function invalidate(id?:string) {
  for(const path of ['/','/properties','/dashboard','/renewals']) revalidatePath(path);
  if(id) revalidatePath(`/properties/${id}`);
}
function failure(error:unknown):ActionResult {
  const message=error && typeof error==='object' && 'message' in error ? String(error.message) : '';
  if(/^(This property|Invalid property|Set a renewal date|Enter |Insured value|Refurbishment cost|Property name|Renewal date|Notes |Field )/.test(message)) return {ok:false,error:message};
  console.error('Property operation failed:',error);
  return {ok:false,error:'Could not save this change. Please retry. Nothing has been confirmed.'};
}
export async function upsertProperty(input:PropertyInput):Promise<ActionResult> {
  try {
    if(typeof input.name!=='string' || !input.name.trim() || input.name.trim().length>200) throw new Error('Property name is required and must be 200 characters or fewer.');
    if(!isDate(input.renewal_date)) throw new Error('Renewal date must be a valid date between 1900 and 9998.');
    for(const [value,max] of [[input.address,500],[input.insurer,200],[input.policy_number,200]] as const) {
      if(typeof value!=='string'||value.length>max) throw new Error(`Field text must be ${max} characters or fewer.`);
    }
    amount(input.insured_value,'Insured value'); amount(input.refurbishment_cost,'Refurbishment cost');
    if(input.id) identity(input.id,input.revision!);
    const id=await saveProperty(input); invalidate(id); return {ok:true,id};
  } catch(error) {return failure(error);}
}
export async function deleteProperty(id:string,revision:number):Promise<ActionResult> {
  try {identity(id,revision); await removeProperty(id,revision); invalidate(id); return {ok:true};}
  catch(error){return failure(error);}
}
export async function renewProperty(input:{id:string;revision:number;insured_value:string;refurbishment_cost:string;notes:string}):Promise<ActionResult> {
  try {
    identity(input.id,input.revision);
    if(typeof input.notes!=='string'||input.notes.length>2000) throw new Error('Notes must be 2000 characters or fewer.');
    await processRenewal(input.id,input.revision,amount(input.insured_value,'Insured value'),amount(input.refurbishment_cost,'Refurbishment cost'),input.notes.trim());
    invalidate(input.id); return {ok:true};
  } catch(error){return failure(error);}
}
