'use client';
export default function ErrorPage({reset}:{reset:()=>void}) {
  return <section className="empty-state error-state"><div className="empty-icon">!</div><h1>Could not load properties. Please retry.</h1><p>Your saved data has not been changed.</p><button className="button primary" onClick={reset}>Retry</button></section>;
}
