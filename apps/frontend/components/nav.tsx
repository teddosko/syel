import Link from 'next/link';

export function Nav() {
  return <nav className="bg-slate-900 text-white p-3 flex gap-4"><Link href="/dashboard/chat">Chat</Link><Link href="/dashboard/connections">Connections</Link><Link href="/dashboard/users">Users</Link><Link href="/dashboard/policies">Policies</Link><Link href="/dashboard/logs">Logs</Link></nav>;
}
