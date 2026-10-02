'use client';
import { usePathname } from 'next/navigation';
import { useEffect,useRef,useState } from 'react';
export function Shell({children}:{children:React.ReactNode}) {
  const path=usePathname(); const [open,setOpen]=useState(false);
  const menuButton=useRef<HTMLButtonElement>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  useEffect(()=>{
    if(!open)return;
    const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);menuButton.current?.focus();}};
    window.addEventListener('keydown',close);
    return ()=>window.removeEventListener('keydown',close);
  },[open]);
  const nav=[['/','Dashboard','◈'],['/properties','Properties','▦'],['/renewals','Renewal list','≡'],['/teams','Team & members','♧']];
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <button ref={menuButton} disabled={!ready} className="mobile-menu" aria-label="Toggle navigation" aria-controls="workspace-navigation" aria-expanded={open} onClick={()=>setOpen(!open)}><span aria-hidden="true">{open?'×':'☰'}</span><span>Fire Insurance</span></button>
    {open&&<button className="navigation-backdrop" aria-label="Close navigation" onClick={()=>{setOpen(false);menuButton.current?.focus();}}/>}
    <aside id="workspace-navigation" className={`sidebar ${open?'is-open':''}`}>
      <a href="/" className="brand"><span className="brand-mark">F</span><span>Fire Insurance<small>Renewal workspace</small></span></a>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">{nav.map(([href,label,icon])=><a key={href} href={href} onClick={()=>setOpen(false)} aria-current={(href==='/'?(path==='/'||path==='/dashboard'):path.startsWith(href))?'page':undefined} className={(href==='/'?(path==='/'||path==='/dashboard'):path.startsWith(href))?'active':''}><span aria-hidden="true">{icon}</span>{label}</a>)}</nav>
      <div className="sidebar-note"><span className="demo-dot"/> Team workspace<p>Manage your team, members and access from Team &amp; members.</p></div>
      <a className="sidebar-footer" href="/teams" onClick={()=>setOpen(false)}><span className="avatar" aria-hidden="true">FI</span><span>Manage workspace<small>Teams &amp; account</small></span></a>
    </aside>
    <main id="main-content" tabIndex={-1} className="workspace">{children}</main>
  </div>;
}
