export type Status = 'upcoming' | 'due' | 'renewed' | 'lapsed';
export interface Property {
  id: string; name: string; address: string | null; insurer: string | null;
  policy_number: string | null; insured_value: number; refurbishment_cost: number;
  updated_value: number; renewal_date: string; reminder_date: string;
  status: Status; revision: number; created_at: string;
}
export interface RenewalRecord {
  id: string; property_id: string; previous_insured_value: number;
  new_insured_value: number; refurbishment_cost: number; updated_value: number;
  renewal_date: string; notes: string | null; created_at: string;
}
export interface PropertyInput {
  id?: string; revision?: number; name: string; address: string; insurer: string;
  policy_number: string; insured_value: string; refurbishment_cost: string; renewal_date: string;
}
export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };
export const STATUSES: Status[] = ['lapsed', 'due', 'upcoming', 'renewed'];
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date());
}
export function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01' && value <= '9998-12-31'
    && !Number.isNaN(Date.parse(value)) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
}
export function reminderDate(value: string) {
  if (!isDate(value)) return '';
  const date = new Date(value+'T00:00:00Z'); date.setUTCDate(date.getUTCDate()-30);
  return date.toISOString().slice(0,10);
}
export function nextYear(value: string) {
  if (!isDate(value)) throw new Error('Enter a valid renewal date.');
  const [year,month,day] = value.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year+1,month,0)).getUTCDate();
  return `${year+1}-${String(month).padStart(2,'0')}-${String(Math.min(day,lastDay)).padStart(2,'0')}`;
}
export function amount(value: string, label = 'Amount') {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) throw new Error(`${label} is required and must be a nonnegative number with at most two decimal places.`);
  const result = Number(value);
  if (result > 999999999999.99) throw new Error(`${label} is too large.`);
  return result;
}
export function updatedValue(insured: number, refurbishment: number) {
  return (Math.round(insured*100)+Math.round(refurbishment*100))/100;
}
export function statusFor(p: Pick<Property,'status'|'renewal_date'|'reminder_date'>, now = today()): Status {
  if (p.renewal_date < now) return 'lapsed';
  if (p.reminder_date <= now) return 'due';
  return p.status === 'renewed' ? 'renewed' : 'upcoming';
}
export function urgency(p: Pick<Property,'reminder_date'>, now=today()) {
  const days = Math.round((Date.parse(p.reminder_date)-Date.parse(now))/86400000);
  return days < 0 ? 100 : days <= 7 ? 80 : days <= 30 ? 50 : 20;
}
export function sortByReminder(properties: Property[]) {
  return [...properties].sort((a,b)=>a.reminder_date.localeCompare(b.reminder_date) || a.renewal_date.localeCompare(b.renewal_date) || a.name.localeCompare(b.name));
}
export function formatAmount(n: number) {
  return new Intl.NumberFormat('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
}
export function formatDate(value: string) {
  if (!isDate(value)) return 'Not set';
  return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(value+'T00:00:00Z'));
}
