import { Property,formatAmount,formatDate } from '@/lib/domain';
import { PropertyControls } from './property-controls';
export function StatusBadge({status}:{status:Property['status']}) {return <span className={`status ${status}`}><i/>{status}</span>;}
export function PropertyTable({properties}:{properties:Property[]}) {
  if(!properties.length) return <section className="empty-state"><div className="empty-icon">▦</div><h2>No properties yet — add your first property.</h2><p>Your values, renewal dates and reminders will appear here.</p><PropertyControls add/></section>;
  return <div className="table-wrap"><table className="property-table"><thead><tr><th>Property</th><th className="numeric">Insured value</th><th className="numeric">Refurbishment</th><th className="numeric">Updated value</th><th>Renewal / reminder</th><th>Status</th><th>Actions</th></tr></thead><tbody>{properties.map(p=><tr key={p.id}>
    <td><a className="property-name" href={`/properties/${p.id}`}>{p.name}</a><span className="cell-detail">{p.address||'No address'}</span><span className="policy-detail">{p.insurer||'Insurer not set'} · {p.policy_number||'No policy number'}</span></td>
    <td className="numeric">{formatAmount(p.insured_value)}</td><td className="numeric">{formatAmount(p.refurbishment_cost)}</td><td className="numeric updated-amount">{formatAmount(p.updated_value)}</td>
    <td className="date-cell">{formatDate(p.renewal_date)}<span className="cell-detail">Reminder {formatDate(p.reminder_date)}</span></td><td><StatusBadge status={p.status}/></td><td><PropertyControls property={p}/></td>
  </tr>)}</tbody></table></div>;
}
