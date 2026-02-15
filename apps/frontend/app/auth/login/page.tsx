'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('ChangeMe123!');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tenantId, email, password }) });
    const data = await res.json();
    if (!res.ok) return setErr(data.error);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('tenantId', tenantId);
    router.push('/dashboard/chat');
  }

  return <main className="min-h-screen flex items-center justify-center"><div className="bg-white rounded shadow p-8 w-96 space-y-3"><h1 className="font-bold text-xl">DB Chat Guard</h1><input className="w-full border p-2" placeholder="Tenant ID" value={tenantId} onChange={(e)=>setTenantId(e.target.value)} /><input className="w-full border p-2" value={email} onChange={(e)=>setEmail(e.target.value)} /><input type="password" className="w-full border p-2" value={password} onChange={(e)=>setPassword(e.target.value)} /><button className="w-full bg-blue-600 text-white p-2 rounded" onClick={submit}>Login</button>{err && <p className="text-red-600">{err}</p>}</div></main>;
}
