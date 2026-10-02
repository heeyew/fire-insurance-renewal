import 'server-only';
import { teamContext,writableTeam } from './teams';
import { RenewalRecord } from '../domain';
export async function listRenewals(propertyId:string) {
  const context=(await teamContext())!;
  const {data,error}=await context.client.from('renewal_records').select('*').eq('team_id',context.team!.id).eq('property_id',propertyId).order('created_at',{ascending:false});
  if(error) throw error;
  return (data as RenewalRecord[]).map(r=>({...r,previous_insured_value:Number(r.previous_insured_value),new_insured_value:Number(r.new_insured_value),refurbishment_cost:Number(r.refurbishment_cost),updated_value:Number(r.updated_value)}));
}
export async function processRenewal(id:string,revision:number,insured:number,refurb:number,notes:string) {
  const context=await writableTeam();
  const property=await context.client.from('properties').select('id').eq('id',id).eq('team_id',context.team!.id).maybeSingle();
  if(property.error || !property.data) throw new Error('This property no longer exists in this team.');
  const {error}=await context.client.rpc('process_property_renewal',{p_property_id:id,p_new_insured_value:insured,p_refurbishment_cost:refurb,p_expected_revision:revision,p_notes:notes});
  if(error) throw error;
}
