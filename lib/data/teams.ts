import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
export type TeamRole='owner'|'editor'|'viewer';
export type Team={id:string;name:string;role:TeamRole};
export async function teamContext(required=true) {
  const client=await db();
  const {data:{user}}=await client.auth.getUser();
  if(!user) {if(required) redirect('/login');return null;}
  const {data,error}=await client.from('team_members').select('team_id,role,teams(id,name)').eq('user_id',user.id);
  if(error) throw error;
  const teams=(data??[]).map(row=>({...(row.teams as unknown as {id:string;name:string}),role:row.role as TeamRole}));
  const selected=(await cookies()).get('active-team')?.value;
  const team=teams.find(t=>t.id===selected)??teams[0];
  if(!team && required) redirect('/teams');
  return {client,user,teams,team};
}
export async function writableTeam() {
  const context=await teamContext();
  if(!context?.team || context.team.role==='viewer') throw new Error('Your team role allows viewing only. Ask an owner for edit access.');
  return context;
}
