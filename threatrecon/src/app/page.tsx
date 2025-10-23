"use client";
import { useEffect, useRef, useState } from 'react';

type Tab = 'name' | 'email' | 'phone' | 'address' | 'username';

export default function Home() {
  const [tab, setTab] = useState<Tab>('name');
  const [form, setForm] = useState<any>({});
  const [sites, setSites] = useState<string[]>([]);
  const [progress, setProgress] = useState<Record<string, any>>({});
  const evtRef = useRef<EventSource | null>(null);

  useEffect(() => () => { evtRef.current?.close(); }, []);

  function startScan() {
    evtRef.current?.close();
    setProgress({});
    const payload: any = { type: tab };
    if (tab === 'name') payload.fullName = form.fullName;
    if (tab === 'email') payload.email = form.email;
    if (tab === 'phone') payload.phone = form.phone;
    if (tab === 'address') payload.streetAddress = form.streetAddress;
    if (tab === 'username') payload.username = form.username;

    const es = new EventSource('/api/scan', { withCredentials: false } as any);
    evtRef.current = es;
    fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'start') setSites(data.sites);
      if (data.type === 'site') setProgress((p) => ({ ...p, [data.site]: data }));
      if (data.type === 'done') es.close();
    };
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold">ThreatRecon.io — Privacy Check & OSINT Finder</h1>
        <p className="mt-2 text-sm text-zinc-600">Enter a name, email, phone, address, or username. We check many people-search and mirror sites respectfully. Blocked sites return opt-out guidance.</p>

        <div className="mt-6 border rounded-lg bg-white">
          <div className="flex border-b">
            {(['name','email','phone','address','username'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm ${tab===t? 'border-b-2 border-black font-medium':'text-zinc-600'}`}>{t}</button>
            ))}
          </div>
          <div className="p-4 grid gap-3">
            {tab==='name' && (
              <input className="border rounded px-3 py-2" placeholder="Full name" value={form.fullName||''} onChange={e=>setForm({...form, fullName:e.target.value})} />
            )}
            {tab==='email' && (
              <input className="border rounded px-3 py-2" placeholder="Email" value={form.email||''} onChange={e=>setForm({...form, email:e.target.value})} />
            )}
            {tab==='phone' && (
              <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone||''} onChange={e=>setForm({...form, phone:e.target.value})} />
            )}
            {tab==='address' && (
              <input className="border rounded px-3 py-2" placeholder="Street address" value={form.streetAddress||''} onChange={e=>setForm({...form, streetAddress:e.target.value})} />
            )}
            {tab==='username' && (
              <input className="border rounded px-3 py-2" placeholder="Username" value={form.username||''} onChange={e=>setForm({...form, username:e.target.value})} />
            )}
            <button onClick={startScan} className="mt-2 inline-flex items-center justify-center rounded bg-black px-4 py-2 text-white">Scan</button>
          </div>
        </div>

        {/* Progress chips */}
        {sites.length>0 && (
          <div className="mt-6 grid grid-cols-1 gap-2">
            {sites.map((s) => {
              const st = progress[s];
              const status = st?.status || 'pending';
              return (
                <div key={s} className="rounded border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s}</div>
                    <div className={`text-xs ${status==='ok'?'text-green-600':status==='cached'?'text-blue-600':status==='blocked'?'text-amber-600':status==='error'?'text-red-600':'text-zinc-500'}`}>{status}</div>
                  </div>
                  {st?.results && st.results.length>0 && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-zinc-600">
                            <th className="pr-4">URL</th>
                            <th className="pr-4">Matched</th>
                            <th className="pr-4">Confidence</th>
                            <th className="pr-4">Reason</th>
                            <th className="pr-4">Opt-out</th>
                          </tr>
                        </thead>
                        <tbody>
                          {st.results.map((r: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="pr-4 py-1 max-w-[360px] truncate"><a className="text-blue-600 underline" href={r.url} target="_blank" rel="noreferrer">{r.url || '—'}</a></td>
                              <td className="pr-4 py-1">{r.matchedAttribute}</td>
                              <td className="pr-4 py-1">{(r.confidence ?? 0).toFixed(2)}</td>
                              <td className="pr-4 py-1">{r.reason}</td>
                              <td className="pr-4 py-1">{r.optOutUrl ? <a className="text-blue-600 underline" href={r.optOutUrl} target="_blank">Opt-out</a> : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
