import { listProperties } from '@/lib/data/properties';
import { PropertyTable } from '@/components/property-table';
import { ExportControls } from '@/components/export-controls';
import { formatAmount,formatDate,today } from '@/lib/domain';
export const dynamic='force-dynamic';
export default async function RenewalList() {
  const properties=await listProperties();
  return <div className="renewal-report"><header className="page-header"><div><div className="eyebrow">ANNUAL RENEWAL</div><h1>Renewal list</h1><p>A current schedule of values and dates, ready to share.</p></div><ExportControls/></header><section className="report-summary"><div><span>Properties</span><strong>{properties.length}</strong></div><div><span>Total insured value</span><strong>{formatAmount(properties.reduce((s,p)=>s+p.insured_value,0))}</strong></div><div><span>Total refurbishment</span><strong>{formatAmount(properties.reduce((s,p)=>s+p.refurbishment_cost,0))}</strong></div><div><span>Total updated value</span><strong>{formatAmount(properties.reduce((s,p)=>s+p.updated_value,0))}</strong></div></section><div className="section-heading"><h2>Property renewal schedule</h2><span>Prepared {formatDate(today())}</span></div><PropertyTable properties={properties}/><p className="workspace-footnote">Updated value = insured value + refurbishment cost. Reminder date = renewal date − 30 days. Amounts are recorded in the currency of your policy; use one consistent currency across this portfolio.</p></div>;
}
