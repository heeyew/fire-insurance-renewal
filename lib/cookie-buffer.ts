import type {CookieOptions} from '@supabase/ssr';
type Cookie={name:string;value:string};
type Change=Cookie&{options:CookieOptions};

// An unsuccessful email request must not replace the verifier for an earlier link.
export function bufferedCookies(read:()=>Cookie[],write:(change:Change)=>void) {
  const changes:Change[]=[];
  return {
    getAll:()=>{
      const values=new Map(read().map(cookie=>[cookie.name,cookie]));
      for(const change of changes) {
        if(change.options.maxAge===0) values.delete(change.name);
        else values.set(change.name,{name:change.name,value:change.value});
      }
      return [...values.values()];
    },
    setAll:(values:Change[])=>{changes.push(...values);},
    commit:()=>{for(const change of changes)write(change);changes.length=0;},
  };
}
