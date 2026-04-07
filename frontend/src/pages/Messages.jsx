import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../api/client'

function Avatar({ photo, name, size = 'w-10 h-10' }) {
  return photo ? (
    <img src={photo} alt={name} className={`${size} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

function ConversationList({ onSelect }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/messages/conversations').then(({ data }) => setConversations(data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-white/30">Loading conversations…</div>
  if (!conversations.length) return (
    <div className="p-12 text-center">
      <div className="text-4xl mb-3">💬</div>
      <h3 className="font-display text-white font-semibold mb-1">No conversations yet</h3>
      <p className="text-white/40 text-sm">Message a match to start a conversation.</p>
    </div>
  )

  return (
    <div className="divide-y divide-white/5">
      {conversations.map((c) => (
        <button key={c.user_id} onClick={() => onSelect(c.user_id)} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left">
          <Avatar photo={c.profile_photo} name={c.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm truncate">{c.name}</span>
              {c.unread_count > 0 && (
                <span className="bg-pink-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{c.unread_count}</span>
              )}
            </div>
            <p className="text-white/40 text-xs truncate">{c.last_message}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

function ChatView({ userId, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [partner, setPartner] = useState(null)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const currentUserId = JSON.parse(localStorage.getItem('rs_user') || '{}')?.id

  useEffect(() => {
    Promise.all([
      api.get(`/messages/${userId}`),
      api.get(`/profiles/${userId}`),
    ]).then(([msgRes, profRes]) => {
      setMessages(msgRes.data)
      setPartner(profRes.data)
      api.patch(`/messages/${userId}/read`)
    })
  }, [userId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const { data } = await api.post(`/messages/${userId}`, { content: input.trim() })
      setMessages((prev) => [...prev, data])
      setInput('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5">
        <button onClick={onBack} className="text-white/40 hover:text-white mr-1">←</button>
        {partner && <Avatar photo={partner.profile_photo || partner.photo_url} name={partner.name} size="w-8 h-8" />}
        <div>
          <div className="text-white font-medium text-sm">{partner?.name}</div>
          {partner?.rs_code && <div className="text-white/30 text-xs font-mono">{partner.rs_code}</div>}
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-purple-600 text-white rounded-br-md' : 'bg-dark-700 text-white/80 rounded-bl-md'}`}>
                <p>{m.content}</p>
                <p className={`text-xs mt-1 ${isMine ? 'text-white/40' : 'text-white/20'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="p-4 border-t border-white/5 flex gap-2">
        <input className="input flex-1 text-sm" placeholder="Type a message…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button onClick={send} disabled={sending || !input.trim()} className="btn-primary text-sm px-4 py-2">
          Send
        </button>
      </div>
    </div>
  )
}

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-romantic pt-20 pb-4">
      <div className="max-w-2xl mx-auto h-[calc(100vh-6rem)]">
        <div className="card h-full flex flex-col overflow-hidden">
          {!selectedUser ? (
            <>
              <div className="p-4 border-b border-white/5">
                <h1 className="font-display text-xl font-bold text-white">Messages</h1>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ConversationList onSelect={setSelectedUser} />
              </div>
            </>
          ) : (
            <ChatView userId={selectedUser} onBack={() => setSelectedUser(null)} />
          )}
        </div>
      </div>
    </div>
  )
}
