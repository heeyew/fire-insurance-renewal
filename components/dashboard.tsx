import Link from 'next/link';
import { Property,Status,formatAmount,formatDate,today,STATUSES,urgency,sortByReminder } from '@/lib/domain';
import { PropertyTable } from './property-table';
import { PropertyControls } from './property-controls';
export function Dashboard({properties,filter}:{properties:Property[];filter?:string}) {
  const counts=Object.fromEntries(STATUSES.map(s=>[s,properties.filter(p=>p.status===s).length])) as Record<Status,number>;
  const selected=STATUSES.includes(filter as Status)?filter as Status:undefined;
  const ranked=sortByReminder(properties).sort((a,b)=>urgency(b)-urgency(a));
  const filtered=selected?ranked.filter(p=>p.status===selected):ranked;
  const total=properties.reduce((sum,p)=>sum+p.updated_value,0);
  return <><header className="page-header"><div><div className="eyebrow">PORTFOLIO OVERVIEW · {formatDate(today()).toUpperCase()}</div><h1>Stay ahead of every renewal.</h1><p>Your property values, upcoming dates and renewal decisions in one place.</p></div><PropertyControls add/></header>
    <div className="summary-grid">{(['due','lapsed','upcoming','renewed'] as Status[]).map(s=><Link key={s} href={`/?status=${s}`} className={`summary-card ${s} ${selected===s?'selected':''}`} aria-label={`Show ${s} properties: ${counts[s]}`}><div className="summary-label">{s==='due'?'Due for renewal':s==='lapsed'?'Lapsed policies':s==='upcoming'?'Upcoming renewals':'Renewed this cycle'}<span className={`summary-dot ${s}`}/></div><strong>{counts[s]}</strong><span className="summary-context">{s==='due'?'Reminder date reached':s==='lapsed'?'Renewal date has passed':s==='upcoming'?'Before the reminder window':'New cycle recorded'}</span></Link>)}</div>
    <section className="portfolio-strip"><span><strong>{properties.length}</strong> properties in your portfolio</span><span>Total updated value <strong>{formatAmount(total)}</strong></span><Link href="/renewals">View renewal list →</Link></section>
    {(counts.due+counts.lapsed)>0&&<div className="attention-note"><span aria-hidden="true">◷</span><p><strong>{counts.due+counts.lapsed} {counts.due+counts.lapsed===1?'property needs':'properties need'} attention.</strong> Review the values and confirm renewals to advance the next cycle.</p></div>}
    <div className="section-heading"><h2>{selected?`${selected[0].toUpperCase()+selected.slice(1)} properties`:'Renewal priorities'} <span className="count">{filtered.length}</span></h2><span>Earliest reminders first</span></div>
    <div className="filter-row" aria-label="Filter properties"><Link href="/" aria-current={!selected?'page':undefined}>All properties</Link>{STATUSES.map(s=><Link key={s} href={`/?status=${s}`} aria-current={selected===s?'page':undefined}>{s[0].toUpperCase()+s.slice(1)} <span>{counts[s]}</span></Link>)}</div>
    {properties.length>0&&filtered.length===0?<section className="empty-state compact"><h2>No {selected} properties</h2><p>There are no properties in this status today.</p><Link href="/" className="button">View all properties</Link></section>:<PropertyTable properties={filtered}/>}
    <p className="workspace-footnote">Reminders are calculated 30 days before renewal. Dates use Kuala Lumpur time. No emails are sent.</p>
  </>;
}
