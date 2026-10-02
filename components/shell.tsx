'use client';
import { usePathname } from 'next/navigation';
import { useEffect,useState } from 'react';
export function Shell({children}:{children:React.ReactNode}) {
  const path=usePathname(); const [open,setOpen]=useState(false);
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  const nav=[['/','Dashboard','◈'],['/properties','Properties','▦'],['/renewals','Renewal list','≡']];
  return <div className="app-shell">
    <button disabled={!ready} className="mobile-menu" aria-label="Toggle navigation" aria-expanded={open} onClick={()=>setOpen(!open)}>☰ <span>Fire Insurance</span></button>
    <aside className={`sidebar ${open?'is-open':''}`}>
      <a href="/" className="brand"><span className="brand-mark">F</span><span>Fire Insurance<small>Renewal workspace</small></span></a>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">{nav.map(([href,label,icon])=><a key={href} href={href} onClick={()=>setOpen(false)} aria-current={(href==='/'?(path==='/'||path==='/dashboard'):path.startsWith(href))?'page':undefined} className={(href==='/'?(path==='/'||path==='/dashboard'):path.startsWith(href))?'active':''}><span aria-hidden="true">{icon}</span>{label}</a>)}</nav>
      <div className="sidebar-note"><span className="demo-dot"/> Demo workspace<p>Sample data is shared and editable. Use this workspace to try the renewal process.</p></div>
      <div className="sidebar-footer"><span className="avatar">DF</span><span>Director of Finance<small>Property portfolio</small></span></div>
    </aside>
    <main className="workspace">{children}</main>
  </div>;
}
