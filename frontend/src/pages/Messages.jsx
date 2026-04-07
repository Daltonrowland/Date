import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import api from '../api/client'

function Avatar({ photo, name, size = 'w-10 h-10' }) {
  return photo ? (
    <img src={photo} alt={name} className={`${size} rounded-full object-cover flex-shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white flex-shrink-0 text-sm`}>
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

  if (loading) return <div className="p-8 text-center text-white/30 text-sm">Loading conversations…</div>
  if (!conversations.length) return (
    <div className="p-12 text-center">
      <div className="text-4xl mb-3">💬</div>
      <h3 className="font-display text-white font-semibold mb-1">No conversations yet</h3>
      <p className="text-white/40 text-sm">Message a match to start chatting.</p>
      <Link to="/dashboard" className="text-purple-400 text-sm mt-3 inline-block">← Find matches</Link>
    </div>
  )

  return (
    <div className="divide-y divide-white/5">
      {conversations.map((c) => (
        <button key={c.user_id} onClick={() => onSelect(c.user_id)}
          className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left">
          <Avatar photo={c.profile_photo} name={c.name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm truncate">{c.name}</span>
              <span className="text-white/20 text-xs flex-shrink-0">
                {new Date(c.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-xs truncate flex-1">{c.last_message}</p>
              {c.unread_count > 0 && (
                <span className="bg-pink-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 px-1">
                  {c.unread_count}
                </span>
              )}
            </div>
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
  const inputRef = useRef(null)
  const currentUserId = JSON.parse(localStorage.getItem('rs_user') || '{}')?.id

  const fetchMessages = useCallback(() => {
    api.get(`/messages/${userId}`).then(({ data }) => setMessages(data))
  }, [userId])

  useEffect(() => {
    Promise.all([
      api.get(`/messages/${userId}`),
      api.get(`/profiles/${userId}`),
    ]).then(([msgRes, profRes]) => {
      setMessages(msgRes.data)
      setPartner(profRes.data)
      api.patch(`/messages/${userId}/read`)
    })
    // Poll every 10 seconds
    const poll = setInterval(() => {
      fetchMessages()
      api.patch(`/messages/${userId}/read`).catch(() => {})
    }, 10000)
    return () => clearInterval(poll)
  }, [userId, fetchMessages])

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      const { data } = await api.post(`/messages/${userId}`, { content: input.trim() })
      setMessages((prev) => [...prev, data])
      setInput('')
      inputRef.current?.focus()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-white/5 flex-shrink-0">
        <button onClick={onBack} className="text-white/40 hover:text-white p-1 min-w-[44px] min-h-[44px] flex items-center justify-center">←</button>
        {partner && <Avatar photo={partner.profile_photo || partner.photo_url} name={partner.name} size="w-8 h-8" />}
        <div className="min-w-0">
          <div className="text-white font-medium text-sm truncate">{partner?.name}</div>
          {partner?.rs_code && <div className="text-white/30 text-xs font-mono">{partner.rs_code}</div>}
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] sm:max-w-[70%] px-3 sm:px-4 py-2 rounded-2xl text-sm ${
                isMine ? 'bg-purple-600 text-white rounded-br-md' : 'bg-dark-700 text-white/80 rounded-bl-md'
              }`}>
                <p className="break-words">{m.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                  <span className={`text-xs ${isMine ? 'text-white/40' : 'text-white/20'}`}>
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMine && m.read_at && <span className="text-purple-300 text-xs">✓✓</span>}
                  {isMine && !m.read_at && <span className="text-white/30 text-xs">✓</span>}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-white/5 flex gap-2 flex-shrink-0">
        <input ref={inputRef} className="input flex-1 text-sm min-h-[44px]" placeholder="Type a message…" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown} />
        <button onClick={send} disabled={sending || !input.trim()}
          className="btn-primary text-sm px-4 min-h-[44px] min-w-[44px]">
          Send
        </button>
      </div>
    </div>
  )
}

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState(null)

  return (
    <div className="min-h-screen bg-gradient-romantic pt-16 sm:pt-20 pb-4">
      <div className="max-w-2xl mx-auto h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)]">
        <div className="card h-full flex flex-col overflow-hidden">
          {!selectedUser ? (
            <>
              <div className="p-4 border-b border-white/5 flex-shrink-0">
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
