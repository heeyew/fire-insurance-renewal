import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/data/properties';
import { listRenewals } from '@/lib/data/renewals';
import { formatAmount,formatDate } from '@/lib/domain';
import { PropertyControls } from '@/components/property-controls';
import { StatusBadge } from '@/components/property-table';
import {teamContext} from '@/lib/data/teams';
import {TeamSummary} from '@/components/team-summary';
export const dynamic='force-dynamic';
export default async function Detail({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  if(!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const property=await getProperty(id); if(!property) notFound();
  const records=await listRenewals(id);
  const context=await teamContext();
  return <><TeamSummary team={context?.team}/><a className="back-link" href="/properties">← All properties</a><header className="page-header"><div><div className="eyebrow">PROPERTY DETAILS</div><h1>{property.name}</h1><p>{property.address||'No address recorded'}</p></div><PropertyControls property={property} readOnly={context?.team?.role==='viewer'}/></header>
    <section className="detail-panel"><div><span>Insurer</span><strong>{property.insurer||'Not set'}</strong></div><div><span>Policy number</span><strong>{property.policy_number||'Not set'}</strong></div><div><span>Status</span><StatusBadge status={property.status}/></div><div><span>Insured value</span><strong>{formatAmount(property.insured_value)}</strong></div><div><span>Refurbishment cost</span><strong>{formatAmount(property.refurbishment_cost)}</strong></div><div><span>Updated value</span><strong>{formatAmount(property.updated_value)}</strong></div><div><span>Renewal date</span><strong>{formatDate(property.renewal_date)}</strong></div><div><span>Reminder date</span><strong>{formatDate(property.reminder_date)}</strong></div></section>
    <div className="section-heading"><h2>Renewal history <span className="count">{records.length}</span></h2><span>Newest first</span></div>
    {!records.length?<section className="empty-state compact"><h2>No renewals recorded yet</h2><p>Confirm a renewal to save the old and new values here.</p></section>:<div className="table-wrap"><table><thead><tr><th>Processed on</th><th className="numeric">Previous value</th><th className="numeric">New insured value</th><th className="numeric">Refurbishment</th><th className="numeric">Updated value</th><th>Notes</th></tr></thead><tbody>{records.map(r=><tr key={r.id}><td>{formatDate(r.renewal_date)}</td><td className="numeric">{formatAmount(r.previous_insured_value)}</td><td className="numeric">{formatAmount(r.new_insured_value)}</td><td className="numeric">{formatAmount(r.refurbishment_cost)}</td><td className="numeric updated-amount">{formatAmount(r.updated_value)}</td><td className="history-notes">{r.notes||'—'}</td></tr>)}</tbody></table></div>}
  </>;
}
