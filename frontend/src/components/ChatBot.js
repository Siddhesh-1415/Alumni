import React, { useState, useEffect, useRef, useCallback } from 'react'
import config from '../config/config'

// ─── Simple markdown renderer (bold, bullets, inline code) ───────────────────
const renderMarkdown = (text) => {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Empty line → spacer
    if (!line.trim()) return <div key={i} className="chatbot-spacer" />

    // Parse inline bold and code within a line
    const parseInline = (str) => {
      const parts = []
      const regex = /\*\*(.+?)\*\*|`(.+?)`/g
      let last = 0, m
      while ((m = regex.exec(str)) !== null) {
        if (m.index > last) parts.push(str.slice(last, m.index))
        if (m[1]) parts.push(<strong key={m.index}>{m[1]}</strong>)
        if (m[2]) parts.push(<code key={m.index} className="chatbot-inline-code">{m[2]}</code>)
        last = m.index + m[0].length
      }
      if (last < str.length) parts.push(str.slice(last))
      return parts
    }

    if (line.startsWith('• ') || line.startsWith('* ')) {
      return <div key={i} className="chatbot-bullet">{parseInline(line.slice(2))}</div>
    }
    return <div key={i}>{parseInline(line)}</div>
  })
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="chatbot-msg chatbot-msg--bot">
    <div className="chatbot-bubble chatbot-bubble--bot chatbot-typing">
      <span /><span /><span />
    </div>
  </div>
)

// ─── Single message bubble ────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  const time = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`chatbot-msg ${isUser ? 'chatbot-msg--user' : 'chatbot-msg--bot'}`}>
      {!isUser && (
        <div className="chatbot-avatar">
          <span>🤖</span>
        </div>
      )}
      <div className={`chatbot-bubble ${isUser ? 'chatbot-bubble--user' : 'chatbot-bubble--bot'}`}>
        <div className="chatbot-bubble-content">
          {renderMarkdown(msg.content)}
        </div>
        {time && <div className="chatbot-time">{time}</div>}
      </div>
    </div>
  )
}

// ─── Quick action chips ───────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: '💼 Jobs', text: 'Show me latest job listings' },
  { label: '📅 Events', text: 'What upcoming events are there?' },
  { label: '🔍 Find Alumni', text: 'Help me find alumni' },
  { label: '🔑 Account Help', text: 'I need help with my account' },
]

// ─── Main ChatBot Widget ──────────────────────────────────────────────────────
const ChatBot = ({ user, isAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [botName, setBotName] = useState('AlumniBot')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [pulse, setPulse] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const token = localStorage.getItem('authToken')

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }, [])

  // ── Fetch public settings (check if enabled) ─────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${config.apiBaseUrl}${config.endpoints.chatbot.settings}`)
        if (res.ok) {
          const data = await res.json()
          setIsEnabled(data.enabled)
          setBotName(data.botName || 'AlumniBot')
          setWelcomeMessage(data.welcomeMessage || '')
        }
      } catch {
        // fail silently — bot defaults to enabled
      }
    }
    fetchSettings()
  }, [])

  // ── Pulse animation every 30s to draw attention ───────────────────────────────
  useEffect(() => {
    if (!isOpen && isEnabled && isAuthenticated) {
      const interval = setInterval(() => {
        setPulse(true)
        setTimeout(() => setPulse(false), 1200)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [isOpen, isEnabled, isAuthenticated])

  // ── Load chat history when opened ────────────────────────────────────────────
  useEffect(() => {
    if (isOpen && isAuthenticated && !hasLoadedHistory && token) {
      setIsLoadingHistory(true)
      fetch(`${config.apiBaseUrl}${config.endpoints.chatbot.history}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.messages.length > 0) {
            setMessages(data.messages)
          } else if (welcomeMessage) {
            setMessages([
              { role: 'assistant', content: welcomeMessage, timestamp: new Date() },
            ])
          } else {
            setMessages([
              {
                role: 'assistant',
                content: `👋 Hi **${user?.name?.split(' ')[0] || 'there'}**! I'm **${botName}**, your AI assistant for the Alumni Portal.\n\nI can help you with:\n• 🔍 **Alumni Search** — find fellow alumni\n• 💼 **Job Listings** — explore opportunities\n• 📅 **Events** — upcoming seminars & reunions\n• 🔑 **Account Help** — login, profile, passwords\n\nHow can I assist you today?`,
                timestamp: new Date(),
              },
            ])
          }
          setHasLoadedHistory(true)
        })
        .catch(() => {
          setMessages([
            {
              role: 'assistant',
              content: '👋 Hello! I\'m your **AlumniBot** assistant. How can I help you today?',
              timestamp: new Date(),
            },
          ])
          setHasLoadedHistory(true)
        })
        .finally(() => setIsLoadingHistory(false))
    }
  }, [isOpen, isAuthenticated, hasLoadedHistory, token, welcomeMessage, botName, user])

  // ── Scroll on new messages ────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen, scrollToBottom])

  // ── Track unread when closed ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant') setUnreadCount((c) => c + 1)
    }
  }, [messages, isOpen])

  const handleOpen = () => {
    setIsOpen(true)
    setUnreadCount(0)
    setIsMinimized(false)
    setTimeout(() => inputRef.current?.focus(), 300)
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || input).trim()
      if (!trimmed || isLoading || !token) return

      const userMsg = { role: 'user', content: trimmed, timestamp: new Date() }
      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setIsLoading(true)
      setShowClearConfirm(false)

      try {
        const res = await fetch(`${config.apiBaseUrl}${config.endpoints.chatbot.message}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: trimmed }),
        })

        const data = await res.json()

        if (res.ok && data.reply) {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: data.reply, timestamp: new Date(), intent: data.intent },
          ])
        } else {
          throw new Error(data.message || 'No reply')
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ I ran into an issue processing your request. Please try again in a moment!',
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [input, isLoading, token]
  )

  // ── Clear history ─────────────────────────────────────────────────────────────
  const clearHistory = async () => {
    try {
      await fetch(`${config.apiBaseUrl}${config.endpoints.chatbot.clearHistory}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setMessages([
        {
          role: 'assistant',
          content: '🗑️ Chat history cleared! How can I help you today?',
          timestamp: new Date(),
        },
      ])
      setHasLoadedHistory(true)
    } catch {
      // ignore
    }
    setShowClearConfirm(false)
  }

  // ── Keyboard handler ──────────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Don't render if bot disabled or user not authenticated
  if (!isEnabled || !isAuthenticated) return null

  return (
    <>
      {/* ─── Styles ─────────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Fab ── */
        .chatbot-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 9999;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(99,102,241,0.45);
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s;
          outline: none;
        }
        .chatbot-fab:hover { transform: scale(1.12); box-shadow: 0 12px 40px rgba(99,102,241,0.6); }
        .chatbot-fab.pulse { animation: chatbot-pulse 1.2s ease-out; }
        @keyframes chatbot-pulse {
          0%  { box-shadow: 0 0 0 0 rgba(99,102,241,0.55); }
          70% { box-shadow: 0 0 0 18px rgba(99,102,241,0); }
          100%{ box-shadow: 0 8px 32px rgba(99,102,241,0.45); }
        }
        .chatbot-fab-icon { font-size: 26px; transition: transform 0.25s; }
        .chatbot-badge {
          position: absolute;
          top: -4px; right: -4px;
          background: #ef4444;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          min-width: 20px; height: 20px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          padding: 0 4px;
          border: 2px solid #fff;
          animation: chatbot-badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes chatbot-badge-pop {
          0%  { transform: scale(0); }
          100%{ transform: scale(1); }
        }

        /* ── Window ── */
        .chatbot-window {
          position: fixed;
          bottom: 104px;
          right: 28px;
          z-index: 9998;
          width: 380px;
          max-height: 600px;
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 24px 80px rgba(0,0,0,0.18), 0 4px 24px rgba(99,102,241,0.12);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: chatbot-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1);
          border: 1px solid rgba(99,102,241,0.1);
        }
        @keyframes chatbot-slide-up {
          from { opacity:0; transform: translateY(20px) scale(0.95); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .chatbot-window.minimized { max-height: 68px; }
        @media (max-width: 440px) {
          .chatbot-window { width: calc(100vw - 24px); right: 12px; bottom: 88px; }
          .chatbot-fab { bottom: 16px; right: 16px; }
        }

        /* ── Header ── */
        .chatbot-header {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%);
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          user-select: none;
        }
        .chatbot-header-avatar {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          border: 2px solid rgba(255,255,255,0.35);
          flex-shrink: 0;
        }
        .chatbot-header-info { flex: 1; min-width: 0; }
        .chatbot-header-name { color: #fff; font-weight: 700; font-size: 15px; line-height: 1.2; }
        .chatbot-header-status {
          display: flex; align-items: center; gap: 5px;
          color: rgba(255,255,255,0.8); font-size: 12px; margin-top: 2px;
        }
        .chatbot-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4ade80;
          animation: chatbot-blink 2s infinite;
        }
        @keyframes chatbot-blink {
          0%,100%{ opacity:1; } 50%{ opacity:0.4; }
        }
        .chatbot-header-actions { display: flex; gap: 6px; }
        .chatbot-header-btn {
          background: rgba(255,255,255,0.15);
          border: none; cursor: pointer;
          color: rgba(255,255,255,0.9);
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          transition: background 0.15s;
        }
        .chatbot-header-btn:hover { background: rgba(255,255,255,0.25); }

        /* ── Messages area ── */
        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f8f9ff;
          min-height: 0;
          scroll-behavior: smooth;
        }
        .chatbot-messages::-webkit-scrollbar { width: 4px; }
        .chatbot-messages::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 4px; }

        /* ── Message ── */
        .chatbot-msg { display: flex; align-items: flex-end; gap: 8px; }
        .chatbot-msg--user  { flex-direction: row-reverse; }
        .chatbot-msg--bot   { flex-direction: row; }
        .chatbot-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; flex-shrink: 0;
        }

        /* ── Bubble ── */
        .chatbot-bubble {
          max-width: 76%;
          padding: 11px 15px;
          border-radius: 18px;
          font-size: 13.5px;
          line-height: 1.6;
          word-break: break-word;
          position: relative;
        }
        .chatbot-bubble--user {
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          color: #fff;
          border-bottom-right-radius: 6px;
        }
        .chatbot-bubble--bot {
          background: #fff;
          color: #1e293b;
          border-bottom-left-radius: 6px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
          border: 1px solid #e8eaf6;
        }
        .chatbot-bubble-content { display: flex; flex-direction: column; gap: 3px; }
        .chatbot-time {
          font-size: 10px;
          opacity: 0.55;
          margin-top: 5px;
          text-align: right;
        }
        .chatbot-bullet { padding-left: 4px; }
        .chatbot-bullet::before { content: ''; }
        .chatbot-inline-code {
          background: rgba(99,102,241,0.12);
          color: #4338ca;
          padding: 1px 5px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
        }
        .chatbot-spacer { height: 4px; }

        /* ── Typing indicator ── */
        .chatbot-typing {
          display: flex; align-items: center; gap: 5px;
          padding: 12px 18px !important;
          min-width: 60px;
        }
        .chatbot-typing span {
          display: inline-block;
          width: 7px; height: 7px; border-radius: 50%;
          background: #818cf8;
          animation: chatbot-bounce 1.1s infinite ease-in-out;
        }
        .chatbot-typing span:nth-child(1){ animation-delay: 0s; }
        .chatbot-typing span:nth-child(2){ animation-delay: 0.15s; }
        .chatbot-typing span:nth-child(3){ animation-delay: 0.3s; }
        @keyframes chatbot-bounce {
          0%,80%,100%{ transform: translateY(0); }
          40%{ transform: translateY(-7px); }
        }

        /* ── Quick actions ── */
        .chatbot-quick-actions {
          padding: 8px 16px 12px;
          display: flex; flex-wrap: wrap; gap: 6px;
          background: #f8f9ff;
          border-top: 1px solid #e8eaf6;
          flex-shrink: 0;
        }
        .chatbot-chip {
          background: #fff;
          border: 1.5px solid #e0e7ff;
          color: #4f46e5;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .chatbot-chip:hover { background: #eef2ff; border-color: #6366f1; transform: translateY(-1px); }

        /* ── Input area ── */
        .chatbot-input-area {
          padding: 12px 14px;
          background: #fff;
          border-top: 1px solid #e8eaf6;
          display: flex;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }
        .chatbot-textarea {
          flex: 1;
          border: 1.5px solid #e0e7ff;
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 13.5px;
          line-height: 1.5;
          resize: none;
          outline: none;
          font-family: inherit;
          color: #1e293b;
          background: #f8f9ff;
          max-height: 100px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .chatbot-textarea:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.12); background: #fff; }
        .chatbot-textarea::placeholder { color: #94a3b8; }
        .chatbot-send-btn {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg,#6366f1,#8b5cf6);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: transform 0.15s, box-shadow 0.15s;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }
        .chatbot-send-btn:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 6px 18px rgba(99,102,241,0.5); }
        .chatbot-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .chatbot-send-btn svg { color: #fff; }

        /* ── Footer note ── */
        .chatbot-footer {
          padding: 6px 16px 10px;
          text-align: center;
          font-size: 10.5px;
          color: #94a3b8;
          background: #fff;
          flex-shrink: 0;
        }

        /* ── Clear confirm ── */
        .chatbot-clear-bar {
          background: #fef2f2;
          border-top: 1px solid #fecaca;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #7f1d1d;
          gap: 8px;
          flex-shrink: 0;
        }
        .chatbot-clear-bar button {
          padding: 4px 12px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .chatbot-clear-yes { background: #ef4444; color: #fff; }
        .chatbot-clear-yes:hover { background: #dc2626; }
        .chatbot-clear-no { background: #f1f5f9; color: #475569; }
        .chatbot-clear-no:hover { background: #e2e8f0; }

        /* ── Loading history ── */
        .chatbot-loading-history {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          gap: 10px;
          color: #818cf8;
          font-size: 13px;
        }
        .chatbot-spinner {
          width: 28px; height: 28px;
          border: 3px solid #e0e7ff;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: chatbot-spin 0.75s linear infinite;
        }
        @keyframes chatbot-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ─── FAB Button ──────────────────────────────────────────────────────── */}
      {!isOpen && (
        <button
          id="chatbot-fab"
          className={`chatbot-fab${pulse ? ' pulse' : ''}`}
          onClick={handleOpen}
          aria-label="Open AI Assistant"
          title={`Chat with ${botName}`}
        >
          <span className="chatbot-fab-icon">🤖</span>
          {unreadCount > 0 && (
            <div className="chatbot-badge">{unreadCount > 9 ? '9+' : unreadCount}</div>
          )}
        </button>
      )}

      {/* ─── Chat Window ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div className={`chatbot-window${isMinimized ? ' minimized' : ''}`} id="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">🤖</div>
            <div className="chatbot-header-info">
              <div className="chatbot-header-name">{botName}</div>
              <div className="chatbot-header-status">
                <div className="chatbot-status-dot" />
                <span>AI-powered assistant</span>
              </div>
            </div>
            <div className="chatbot-header-actions">
              <button
                className="chatbot-header-btn"
                onClick={() => setShowClearConfirm(true)}
                title="Clear chat history"
                aria-label="Clear"
              >
                🗑️
              </button>
              <button
                className="chatbot-header-btn"
                onClick={() => setIsMinimized((m) => !m)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '⬆️' : '➖'}
              </button>
              <button
                className="chatbot-header-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body — only visible when not minimized */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="chatbot-messages" id="chatbot-messages">
                {isLoadingHistory ? (
                  <div className="chatbot-loading-history">
                    <div className="chatbot-spinner" />
                    <span>Loading conversation…</span>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <MessageBubble key={i} msg={msg} />
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Quick Action Chips */}
              {messages.length <= 1 && !isLoading && (
                <div className="chatbot-quick-actions">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      className="chatbot-chip"
                      onClick={() => sendMessage(a.text)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Clear confirm bar */}
              {showClearConfirm && (
                <div className="chatbot-clear-bar">
                  <span>Clear all chat history?</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="chatbot-clear-yes" onClick={clearHistory}>Yes, Clear</button>
                    <button className="chatbot-clear-no" onClick={() => setShowClearConfirm(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="chatbot-input-area">
                <textarea
                  ref={inputRef}
                  id="chatbot-input"
                  className="chatbot-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything…"
                  rows={1}
                  disabled={isLoading}
                  maxLength={800}
                />
                <button
                  id="chatbot-send-btn"
                  className="chatbot-send-btn"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Footer */}
              <div className="chatbot-footer">
                Powered by Alumni Portal AI · Rule-based & OpenAI
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default ChatBot
