import 'server-only';
import { db } from './db';
import { Property, PropertyInput, amount, reminderDate, statusFor, updatedValue } from '../domain';
export function normalize(row: Property): Property {
  const property={...row,insured_value:Number(row.insured_value),refurbishment_cost:Number(row.refurbishment_cost),updated_value:Number(row.updated_value)};
  return {...property,status:statusFor(property)};
}
export async function listProperties() {
  const {data,error}=await db().from('properties').select('*').order('reminder_date').order('name');
  if(error) throw error;
  return (data as Property[]).map(normalize);
}
export async function getProperty(id:string) {
  const {data,error}=await db().from('properties').select('*').eq('id',id).maybeSingle();
  if(error) throw error;
  return data ? normalize(data as Property) : null;
}
export async function saveProperty(input:PropertyInput) {
  const client=db();
  const insured=amount(input.insured_value,'Insured value'), refurb=amount(input.refurbishment_cost,'Refurbishment cost');
  const reminder=reminderDate(input.renewal_date);
  const base={name:input.name.trim(),address:input.address.trim(),insurer:input.insurer.trim(),policy_number:input.policy_number.trim(),
    insured_value:insured,refurbishment_cost:refurb,updated_value:updatedValue(insured,refurb),renewal_date:input.renewal_date,reminder_date:reminder};
  if(input.id) {
    // Ordinary metadata edits preserve renewed status; changing a cycle date resets it.
    const old=await getProperty(input.id);
    if(!old) throw new Error('This property no longer exists.');
    const status=old.renewal_date===input.renewal_date ? old.status : statusFor({...base,status:'upcoming'});
    const {data,error}=await client.from('properties').update({...base,status}).eq('id',input.id).eq('revision',input.revision).select('id').maybeSingle();
    if(error) throw error;
    if(!data) throw new Error('This property changed. Refresh and try again.');
    return data.id as string;
  }
  const {data,error}=await client.from('properties').insert({...base,status:statusFor({...base,status:'upcoming'})}).select('id').single();
  if(error) throw error;
  return data.id as string;
}
export async function removeProperty(id:string, revision:number) {
  const {data,error}=await db().from('properties').delete().eq('id',id).eq('revision',revision).select('id').maybeSingle();
  if(error) throw error;
  if(!data) throw new Error('This property changed or was removed. Refresh and try again.');
}
