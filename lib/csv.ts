import type { Property } from './domain';
export const CSV_HEADERS=['Property name','Address','Insurer','Policy number','Insured value','Refurbishment cost','Updated value','Renewal date','Reminder date','Status'];
function escapeCell(value:unknown) {
  let text=String(value??'');
  // Prevent user-entered names, policy numbers and addresses becoming Excel formulas.
  if(/^\s*[=+\-@]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function propertiesCsv(properties:Property[]) {
  const rows=[CSV_HEADERS,...properties.map(p=>[p.name,p.address,p.insurer,p.policy_number,p.insured_value.toFixed(2),p.refurbishment_cost.toFixed(2),p.updated_value.toFixed(2),p.renewal_date,p.reminder_date,p.status])];
  return '\uFEFF'+rows.map(row=>row.map(escapeCell).join(',')).join('\r\n')+'\r\n';
}
