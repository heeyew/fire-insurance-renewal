'use client';
import {useEffect,useState} from 'react';
export function ExportControls() {
  const [pending,setPending]=useState(false),[error,setError]=useState('');
  const [ready,setReady]=useState(false);
  useEffect(()=>setReady(true),[]);
  async function download() {
    setPending(true);setError('');
    try {
      const response=await fetch('/api/export/csv',{cache:'no-store'});
      if(!response.ok) throw new Error('Could not export the renewal list. Please retry.');
      const url=URL.createObjectURL(await response.blob());
      const link=document.createElement('a');link.href=url;link.download=response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]||'fire-insurance-renewals.csv';document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    } catch(e){setError(e instanceof Error?e.message:'Could not export the renewal list. Please retry.');}
    finally{setPending(false);}
  }
  return <div className="export-controls no-print"><div className="export-buttons"><button disabled={!ready} className="button" onClick={()=>window.print()}>Print list</button><button className="button primary" disabled={!ready||pending} onClick={download}>{pending?'Preparing…':'↓ Export CSV'}</button></div>{error&&<p role="alert" className="form-error">{error}</p>}</div>;
}
