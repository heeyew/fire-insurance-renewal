import {listProperties} from '@/lib/data/properties';
import {propertiesCsv} from '@/lib/csv';
import {today} from '@/lib/domain';
import {teamContext} from '@/lib/data/teams';
export const dynamic='force-dynamic';
export async function GET() {
  const context=await teamContext(false);
  if(!context) return Response.json({error:'Sign in to export your team portfolio.'},{status:401});
  if(!context.team) return Response.json({error:'Create or join a team first.'},{status:403});
  try{return new Response(propertiesCsv(await listProperties()),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="fire-insurance-renewals-${today()}.csv"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
  catch(error){console.error('Renewal export failed:',error);return Response.json({error:'Could not export the renewal list. Please retry.'},{status:503});}
}
