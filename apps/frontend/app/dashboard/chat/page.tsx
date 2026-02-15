'use client';
import { useState } from 'react';

export default function ChatPage() {
  const [conversationId, setConversationId] = useState('');
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  async function send() {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/${conversationId}/message`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` }, body: JSON.stringify({ content }) });
    const data = await res.json();
    if (res.ok) setMessages((m) => [...m, data.message]);
  }

  return <div className="space-y-4"><h1 className="text-2xl font-semibold">Secure SQL Chat</h1><input className="border p-2 w-full" placeholder="Conversation ID" value={conversationId} onChange={(e)=>setConversationId(e.target.value)} /><textarea className="border p-2 w-full" placeholder="Ask a question" value={content} onChange={(e)=>setContent(e.target.value)} /><button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={send}>Send</button><div className="space-y-3">{messages.map((m) => <div key={m.id} className="bg-white rounded border p-3"><p>{m.content}</p><details><summary>Executed SQL</summary><pre className="text-xs">{m.metadata?.sql}</pre></details><p className="text-xs">Rows: {m.metadata?.rowCount} • {m.metadata?.latencyMs}ms</p></div>)}</div></div>;
}
