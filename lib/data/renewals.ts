import 'server-only';
import { db } from './db';
import { RenewalRecord } from '../domain';
export async function listRenewals(propertyId:string) {
  const {data,error}=await db().from('renewal_records').select('*').eq('property_id',propertyId).order('created_at',{ascending:false});
  if(error) throw error;
  return (data as RenewalRecord[]).map(r=>({...r,previous_insured_value:Number(r.previous_insured_value),new_insured_value:Number(r.new_insured_value),refurbishment_cost:Number(r.refurbishment_cost),updated_value:Number(r.updated_value)}));
}
export async function processRenewal(id:string,revision:number,insured:number,refurb:number,notes:string) {
  const {error}=await db().rpc('process_property_renewal',{p_property_id:id,p_new_insured_value:insured,p_refurbishment_cost:refurb,p_expected_revision:revision,p_notes:notes});
  if(error) throw error;
}
