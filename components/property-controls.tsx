'use client';
import { useEffect,useRef,useState,useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Property,PropertyInput,formatAmount,formatDate,reminderDate,nextYear,updatedValue } from '@/lib/domain';
import { upsertProperty,renewProperty,deleteProperty } from '@/lib/actions';
type Mode='add'|'edit'|'renew'|'delete';
const blank:PropertyInput={name:'',address:'',insurer:'',policy_number:'',insured_value:'',refurbishment_cost:'0',renewal_date:''};
export function PropertyControls({property,add=false}:{property?:Property;add?:boolean}) {
  const [mode,setMode]=useState<Mode|null>(null),[form,setForm]=useState<PropertyInput>(blank),[notes,setNotes]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [pending,start]=useTransition(); const router=useRouter(); const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(mode) dialog.current?.showModal(); else dialog.current?.close();},[mode]);
  function open(next:Mode) {
    setError(''); setNotice(''); setNotes('');
    setForm(property?{id:property.id,revision:property.revision,name:property.name,address:property.address||'',insurer:property.insurer||'',policy_number:property.policy_number||'',insured_value:String(property.insured_value),refurbishment_cost:String(property.refurbishment_cost),renewal_date:property.renewal_date}:blank);
    setMode(next);
  }
  const change=(key:keyof PropertyInput,value:string)=>setForm(old=>({...old,[key]:value}));
  const preview=form.insured_value!==''&&form.refurbishment_cost!==''&&Number.isFinite(Number(form.insured_value))&&Number.isFinite(Number(form.refurbishment_cost)) ? updatedValue(Number(form.insured_value),Number(form.refurbishment_cost)) : null;
  function submit(event:React.FormEvent) {
    event.preventDefault(); setError('');
    start(async()=>{
      const result=mode==='delete'?await deleteProperty(property!.id,property!.revision):mode==='renew'?await renewProperty({id:property!.id,revision:property!.revision,insured_value:form.insured_value,refurbishment_cost:form.refurbishment_cost,notes}):await upsertProperty(form);
      if(!result.ok){setError(result.error);return;}
      const message=mode==='renew'?'Renewal recorded. Values and dates have been updated.':mode==='delete'?'Property deleted.':'Property saved.';
      setMode(null); setNotice(message);
      if(mode==='delete'&&window.location.pathname===`/properties/${property?.id}`) router.push('/properties');
      router.refresh();
    });
  }
  return <>
    {add?<button className="button primary" onClick={()=>open('add')}>＋ Add property</button>:<div className="row-actions"><button className="button renew" onClick={()=>open('renew')}>Renew</button><button className="text-button" onClick={()=>open('edit')}>Edit</button><button className="text-button danger" onClick={()=>open('delete')}>Delete</button></div>}
    {notice&&<div role="status" className="toast"><span>{notice}</span><button aria-label="Dismiss notification" onClick={()=>setNotice('')}>×</button></div>}
    <dialog ref={dialog} onCancel={e=>{if(pending)e.preventDefault();else setMode(null);}} aria-labelledby={`dialog-${property?.id||'new'}`} className="modal">
      <form onSubmit={submit}>
        <div className="modal-head"><div><div className="eyebrow">{mode==='renew'?'ANNUAL RENEWAL':'PROPERTY PORTFOLIO'}</div><h2 id={`dialog-${property?.id||'new'}`}>{mode==='add'?'Add property':mode==='edit'?'Edit property':mode==='delete'?'Delete property?':`Renew ${property?.name}`}</h2></div><button type="button" aria-label="Close dialog" disabled={pending} className="close-button" onClick={()=>setMode(null)}>×</button></div>
        {mode==='delete'?<p>Delete <strong>{property?.name}</strong> and its renewal history? This cannot be undone.</p>:<>
          {mode!=='renew'&&<><label>Property name<input required maxLength={200} autoComplete="off" value={form.name} onChange={e=>change('name',e.target.value)} placeholder="e.g. Marina Bay Tower"/></label><label>Address<input maxLength={500} value={form.address} onChange={e=>change('address',e.target.value)} placeholder="Street address"/></label><div className="form-grid"><label>Insurer<input maxLength={200} value={form.insurer} onChange={e=>change('insurer',e.target.value)}/></label><label>Policy number<input maxLength={200} value={form.policy_number} onChange={e=>change('policy_number',e.target.value)}/></label></div></>}
          {mode==='renew'&&<p className="modal-context">Current insured value <strong>{formatAmount(property!.insured_value)}</strong><br/>This records the renewal and advances the current renewal date by one year.</p>}
          <div className="form-grid"><label>{mode==='renew'?'New insured value':'Insured value'}<input type="number" required min="0" max="999999999999.99" step="0.01" inputMode="decimal" value={form.insured_value} onChange={e=>change('insured_value',e.target.value)}/></label><label>Refurbishment cost<input type="number" required min="0" max="999999999999.99" step="0.01" inputMode="decimal" value={form.refurbishment_cost} onChange={e=>change('refurbishment_cost',e.target.value)}/></label></div>
          <div className="calculation" aria-live="polite"><span>Updated value<small>Insured value + refurbishment cost</small></span><strong>{preview===null?'—':formatAmount(preview)}</strong></div>
          {mode!=='renew'?<div className="form-grid"><label>Renewal date<input type="date" required min="1900-01-01" max="9998-12-31" value={form.renewal_date} onChange={e=>change('renewal_date',e.target.value)}/></label><div className="derived-date"><span>Reminder date</span><strong>{formatDate(reminderDate(form.renewal_date))}</strong><small>30 days before renewal</small></div></div>:<><div className="renewal-dates"><span>Next renewal<strong>{formatDate(nextYear(property!.renewal_date))}</strong></span><span>Next reminder<strong>{formatDate(reminderDate(nextYear(property!.renewal_date)))}</strong></span></div><label>Notes <span className="optional">optional</span><textarea maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What changed this year?" rows={3}/></label></>}
        </>}
        {error&&<p role="alert" className="form-error">{error}</p>}
        <div className="modal-foot"><button type="button" disabled={pending} className="button" onClick={()=>setMode(null)}>Cancel</button><button type="submit" disabled={pending} className={`button ${mode==='delete'?'destructive':'primary'}`}>{pending?'Saving…':mode==='renew'?'Confirm renewal':mode==='delete'?'Delete property':'Save property'}</button></div>
      </form>
    </dialog>
  </>;
}
