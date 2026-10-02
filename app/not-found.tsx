import Link from 'next/link';
export default function NotFound(){return <section className="empty-state"><h1>Property not found</h1><p>It may have been deleted or the link is out of date.</p><Link href="/properties" className="button primary">Back to properties</Link></section>;}
